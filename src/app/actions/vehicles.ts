"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import {
  DEFAULT_SERVICE_INTERVAL_KM,
  DEFAULT_TYRE_INTERVAL_KM,
  type VehicleStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { dueItems } from "@/lib/maintenance";
import { isVehicleStatus } from "@/lib/status";

function intField(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(String(formData.get(key) ?? fallback), 10);
  return Number.isFinite(value) ? value : fallback;
}

function vehiclePayload(formData: FormData) {
  const requestedStatus = String(formData.get("status") ?? "available");
  const status: VehicleStatus = isVehicleStatus(requestedStatus) ? requestedStatus : "available";

  return {
    make: String(formData.get("make") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    year: intField(formData, "year", new Date().getFullYear()),
    rego: String(formData.get("rego") ?? "").trim().toUpperCase(),
    vin: String(formData.get("vin") ?? "").trim() || null,
    colour: String(formData.get("colour") ?? "").trim(),
    odometerKm: intField(formData, "odometerKm"),
    status,
    serviceIntervalKm: intField(formData, "serviceIntervalKm", DEFAULT_SERVICE_INTERVAL_KM),
    tyreIntervalKm: intField(formData, "tyreIntervalKm", DEFAULT_TYRE_INTERVAL_KM),
    lastServiceKm: intField(formData, "lastServiceKm"),
    lastTyreKm: intField(formData, "lastTyreKm"),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

function withAttention(payload: ReturnType<typeof vehiclePayload>) {
  if (payload.status === "on_rent" || payload.status === "maintenance") {
    return payload;
  }
  const nextStatus = dueItems(payload).length > 0 ? "attention" : payload.status === "attention" ? "attention" : "available";
  return { ...payload, status: nextStatus };
}

export async function createVehicle(formData: FormData): Promise<void> {
  await requireSession();
  const payload = withAttention(vehiclePayload(formData));
  const vehicle = await prisma.vehicle.create({ data: payload });
  revalidatePath("/");
  revalidatePath("/vehicles");
  redirect(`/vehicles/${vehicle.id}`);
}

export async function updateVehicle(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Vehicle not found");
  }

  const payload = vehiclePayload(formData);
  if (existing.status === "on_rent") {
    payload.status = "on_rent";
  }

  const next = withAttention(payload);
  await prisma.vehicle.update({ where: { id }, data: next });
  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
}

export async function setVehicleStatus(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const requested = String(formData.get("status") ?? "");
  if (!isVehicleStatus(requested)) {
    throw new Error("Unknown vehicle status");
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status === "on_rent" && requested !== "on_rent") {
    throw new Error("Return the hire before changing this car's status.");
  }

  await prisma.vehicle.update({ where: { id }, data: { status: requested } });
  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
}

export async function deleteVehicle(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { rentals: { where: { status: { in: ["draft", "on_rent", "on_hold"] } } } },
  });
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.rentals.length > 0) {
    throw new Error("This car still has an open hire. Close it before deleting.");
  }

  await prisma.vehicle.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/vehicles");
  redirect("/vehicles");
}
