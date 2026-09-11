"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { CONDITION_SLOTS, LICENCE_SLOTS } from "@/lib/constants";
import { addDays, fromDateTimeLocalValue } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { nextStatusAfterReturn } from "@/lib/maintenance";
import { parseAudToCents } from "@/lib/money";

async function getOwnerHoldDays(): Promise<number> {
  const owner = await prisma.ownerProfile.findUnique({ where: { id: "default" } });
  return owner?.holdPeriodDays ?? 6;
}

function revalidateRental(id: string, vehicleId?: string) {
  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath("/maintenance");
  revalidatePath(`/rentals/${id}`);
  revalidatePath(`/rentals/${id}/return`);
  revalidatePath(`/rentals/${id}/agreement`);
  if (vehicleId) revalidatePath(`/vehicles/${vehicleId}`);
}

export async function createRental(formData: FormData): Promise<void> {
  await requireSession();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status === "on_rent") {
    throw new Error("That car is already on hire.");
  }
  if (vehicle.status === "maintenance") {
    throw new Error("That car is in maintenance.");
  }

  const plannedStart = fromDateTimeLocalValue(String(formData.get("plannedStart") ?? ""));
  const plannedEnd = fromDateTimeLocalValue(String(formData.get("plannedEnd") ?? ""));
  if (Number.isNaN(plannedStart.getTime()) || Number.isNaN(plannedEnd.getTime())) {
    throw new Error("Enter a start and end time.");
  }
  if (plannedEnd <= plannedStart) {
    throw new Error("The end time must be after the start.");
  }

  const rental = await prisma.rental.create({
    data: {
      vehicleId,
      plannedStart,
      plannedEnd,
      startOdometerKm: vehicle.odometerKm,
      notes: String(formData.get("notes") ?? "").trim(),
    },
  });

  revalidateRental(rental.id, vehicleId);
  redirect(`/rentals/${rental.id}`);
}

export async function saveRenterDetails(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const id = String(formData.get("rentalId") ?? "");
  const renterMobile = String(formData.get("renterMobile") ?? "").trim();
  if (!renterMobile) {
    return { error: "Renter mobile is required." };
  }

  const rental = await prisma.rental.findUnique({ where: { id } });
  if (!rental || rental.status !== "draft") {
    return { error: "This hire can no longer be edited." };
  }

  await prisma.rental.update({
    where: { id },
    data: {
      renterName: String(formData.get("renterName") ?? "").trim(),
      renterLicenceNumber: String(formData.get("renterLicenceNumber") ?? "").trim(),
      renterLicenceExpiry: String(formData.get("renterLicenceExpiry") ?? "").trim(),
      renterAddress: String(formData.get("renterAddress") ?? "").trim(),
      renterDob: String(formData.get("renterDob") ?? "").trim(),
      renterLicenceClass: String(formData.get("renterLicenceClass") ?? "").trim(),
      renterMobile,
    },
  });

  revalidateRental(id);
  return {};
}

export async function handOverRental(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const id = String(formData.get("rentalId") ?? "");
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { photos: true, vehicle: true },
  });
  if (!rental || rental.status !== "draft") {
    return { error: "This hire is not waiting for handover." };
  }
  if (!rental.renterMobile || !rental.renterName) {
    return { error: "Save the renter details first." };
  }

  const missingLicence = LICENCE_SLOTS.filter(
    (slot) => !rental.photos.some((photo) => photo.category === "licence" && photo.slot === slot.id),
  );
  const missingHandover = CONDITION_SLOTS.filter(
    (slot) => !rental.photos.some((photo) => photo.category === "handover" && photo.slot === slot.id),
  );
  if (missingLicence.length > 0) {
    return { error: `Still need licence photos: ${missingLicence.map((slot) => slot.label).join(", ")}.` };
  }
  if (missingHandover.length > 0) {
    return { error: `Still need handover photos: ${missingHandover.map((slot) => slot.label).join(", ")}.` };
  }

  const startOdometerKm = Number.parseInt(String(formData.get("startOdometerKm") ?? ""), 10);
  const startFuel = String(formData.get("startFuel") ?? "").trim();
  if (!Number.isFinite(startOdometerKm) || startOdometerKm < 0 || startOdometerKm > 2_000_000) {
    return { error: "Enter a sensible handover odometer (km)." };
  }
  if (!startFuel) {
    return { error: "Enter the handover fuel level." };
  }

  try {
    await prisma.$transaction([
      prisma.rental.update({
        where: { id },
        data: {
          status: "on_rent",
          handedOverAt: new Date(),
          startOdometerKm,
          startFuel,
        },
      }),
      prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: "on_rent", odometerKm: startOdometerKm },
      }),
      prisma.odometerReading.create({
        data: {
          vehicleId: rental.vehicleId,
          rentalId: rental.id,
          km: startOdometerKm,
          source: "rental_start",
        },
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not hand over.";
    return { error: message };
  }

  revalidateRental(id, rental.vehicleId);
  return {};
}

export async function returnRental(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const id = String(formData.get("rentalId") ?? "");
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { photos: true, vehicle: true },
  });
  if (!rental || rental.status !== "on_rent") {
    return { error: "This hire is not out on the road." };
  }

  const missingReturn = CONDITION_SLOTS.filter(
    (slot) => !rental.photos.some((photo) => photo.category === "return" && photo.slot === slot.id),
  );
  if (missingReturn.length > 0) {
    return { error: `Still need return photos: ${missingReturn.map((slot) => slot.label).join(", ")}.` };
  }

  const returnOdometerKm = Number.parseInt(String(formData.get("returnOdometerKm") ?? ""), 10);
  const returnFuel = String(formData.get("returnFuel") ?? "").trim();
  if (!Number.isFinite(returnOdometerKm) || returnOdometerKm < 0 || returnOdometerKm > 2_000_000) {
    return { error: "Enter a sensible return odometer (km)." };
  }
  if (rental.startOdometerKm != null && returnOdometerKm < rental.startOdometerKm) {
    return { error: "Return odometer cannot be below the handover reading." };
  }
  if (!returnFuel) {
    return { error: "Enter the return fuel level." };
  }

  const holdDays = Number.parseInt(String(formData.get("holdPeriodDays") ?? ""), 10);
  const ownerDays = await getOwnerHoldDays();
  const period = Number.isFinite(holdDays) && holdDays > 0 ? holdDays : ownerDays;
  const now = new Date();
  const vehicleAfterReturn = {
    ...rental.vehicle,
    odometerKm: returnOdometerKm,
  };

  try {
    await prisma.$transaction([
      prisma.rental.update({
        where: { id },
        data: {
          status: "on_hold",
          returnedAt: now,
          returnOdometerKm,
          returnFuel,
          holdUntil: addDays(now, period),
          notes: String(formData.get("notes") ?? rental.notes).trim(),
        },
      }),
      prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: {
          odometerKm: returnOdometerKm,
          status: nextStatusAfterReturn(vehicleAfterReturn),
        },
      }),
      prisma.odometerReading.create({
        data: {
          vehicleId: rental.vehicleId,
          rentalId: rental.id,
          km: returnOdometerKm,
          source: "rental_return",
        },
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not take the return.";
    return { error: message };
  }

  revalidateRental(id, rental.vehicleId);
  redirect(`/rentals/${id}`);
}

export async function addCharge(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const rentalId = String(formData.get("rentalId") ?? "");
  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental || (rental.status !== "on_hold" && rental.status !== "closed")) {
    return { error: "Charges can only be added after return." };
  }

  const description = String(formData.get("description") ?? "").trim();
  const amountCents = parseAudToCents(String(formData.get("amount") ?? ""));
  if (!description) return { error: "Describe the charge." };
  if (amountCents <= 0) return { error: "Enter an amount in dollars." };

  await prisma.charge.create({
    data: { rentalId, description, amountCents },
  });

  if (rental.status === "closed") {
    await prisma.rental.update({
      where: { id: rentalId },
      data: { status: "on_hold", holdReleasedAt: null },
    });
  }

  revalidateRental(rentalId, rental.vehicleId);
  return {};
}

export async function releaseHold(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const id = String(formData.get("rentalId") ?? "");
  const rental = await prisma.rental.findUnique({ where: { id } });
  if (!rental || rental.status !== "on_hold") {
    return { error: "This hire is not on hold." };
  }

  await prisma.rental.update({
    where: { id },
    data: { status: "closed", holdReleasedAt: new Date() },
  });

  revalidateRental(id, rental.vehicleId);
  return {};
}
