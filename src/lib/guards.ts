import type { RentalStatus, VehicleStatus } from "@/lib/constants";
import { isRentalStatus, isVehicleStatus } from "@/lib/status";

export function asVehicleStatus(value: string): VehicleStatus {
  if (!isVehicleStatus(value)) {
    throw new Error(`Unknown vehicle status: ${value}`);
  }
  return value;
}

export function asRentalStatus(value: string): RentalStatus {
  if (!isRentalStatus(value)) {
    throw new Error(`Unknown rental status: ${value}`);
  }
  return value;
}
