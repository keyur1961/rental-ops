"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { addDays } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { nextStatusAfterOdometer } from "@/lib/maintenance";
import { saveVehicleOdometerPhoto } from "@/lib/uploads";

function revalidateVehicle(vehicleId: string) {
  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath("/maintenance");
  revalidatePath(`/vehicles/${vehicleId}`);
}

export async function recordOdometer(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const km = Number.parseInt(String(formData.get("km") ?? ""), 10);
  const file = formData.get("file");

  if (!Number.isFinite(km) || km < 0) {
    return { error: "Enter the odometer in kilometres." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Upload a clear odometer photo." };
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { rentals: { where: { status: "on_rent" }, take: 1 } },
  });
  if (!vehicle) return { error: "Vehicle not found." };

  const activeRental = vehicle.rentals[0];
  const photoPath = await saveVehicleOdometerPhoto({
    vehicleId,
    rentalId: activeRental?.id,
    file,
  });

  await prisma.$transaction([
    prisma.odometerReading.create({
      data: {
        vehicleId,
        rentalId: activeRental?.id,
        km,
        photoPath,
        source: "upload",
      },
    }),
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        odometerKm: km,
        status: nextStatusAfterOdometer(vehicle, km),
      },
    }),
  ]);

  revalidateVehicle(vehicleId);
  return {};
}

export async function markServiceDone(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status === "on_rent") throw new Error("Return the car before clearing service.");

  const dueTyres = vehicle.odometerKm >= vehicle.lastTyreKm + vehicle.tyreIntervalKm;
  await prisma.vehicle.update({
    where: { id },
    data: {
      lastServiceKm: vehicle.odometerKm,
      status: vehicle.status === "maintenance" ? "maintenance" : dueTyres ? "attention" : "available",
    },
  });
  revalidateVehicle(id);
}

export async function markTyresDone(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status === "on_rent") throw new Error("Return the car before clearing tyres.");

  const dueService = vehicle.odometerKm >= vehicle.lastServiceKm + vehicle.serviceIntervalKm;
  await prisma.vehicle.update({
    where: { id },
    data: {
      lastTyreKm: vehicle.odometerKm,
      status: vehicle.status === "maintenance" ? "maintenance" : dueService ? "attention" : "available",
    },
  });
  revalidateVehicle(id);
}

export async function createOdometerToken(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireSession();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return { error: "Vehicle not found." };

  const token = randomBytes(8).toString("hex");
  await prisma.odometerToken.create({
    data: {
      token,
      vehicleId,
      expiresAt: addDays(new Date(), 7),
    },
  });

  revalidatePath("/maintenance");
  return { url: `/odometer/${token}` };
}

export async function submitTokenOdometer(
  token: string,
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const record = await prisma.odometerToken.findUnique({
    where: { token },
    include: { vehicle: { include: { rentals: { where: { status: "on_rent" }, take: 1 } } } },
  });
  if (!record) return { error: "This link is not valid." };
  if (record.usedAt) return { error: "This link has already been used." };
  if (record.expiresAt.getTime() < Date.now()) return { error: "This link has expired." };

  const km = Number.parseInt(String(formData.get("km") ?? ""), 10);
  const file = formData.get("file");
  if (!Number.isFinite(km) || km < 0) return { error: "Enter the odometer in kilometres." };
  if (!(file instanceof File) || file.size === 0) return { error: "Upload a clear odometer photo." };

  const activeRental = record.vehicle.rentals[0];
  const photoPath = await saveVehicleOdometerPhoto({
    vehicleId: record.vehicleId,
    rentalId: activeRental?.id,
    file,
  });

  await prisma.$transaction([
    prisma.odometerReading.create({
      data: {
        vehicleId: record.vehicleId,
        rentalId: activeRental?.id,
        km,
        photoPath,
        source: "token",
      },
    }),
    prisma.vehicle.update({
      where: { id: record.vehicleId },
      data: {
        odometerKm: km,
        status: nextStatusAfterOdometer(record.vehicle, km),
      },
    }),
    prisma.odometerToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  revalidateVehicle(record.vehicleId);
  return { ok: true };
}
