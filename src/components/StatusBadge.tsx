import type { RentalStatus, VehicleStatus } from "@/lib/constants";
import {
  rentalStatusLabel,
  rentalStatusTone,
  vehicleStatusLabel,
  vehicleStatusTone,
} from "@/lib/status";

export function VehicleBadge({ status }: { status: VehicleStatus }) {
  return <span className={`badge ${vehicleStatusTone(status)}`}>{vehicleStatusLabel(status)}</span>;
}

export function RentalBadge({ status }: { status: RentalStatus }) {
  return <span className={`badge ${rentalStatusTone(status)}`}>{rentalStatusLabel(status)}</span>;
}
