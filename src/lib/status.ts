import {
  RENTAL_STATUSES,
  VEHICLE_STATUSES,
  type RentalStatus,
  type VehicleStatus,
} from "@/lib/constants";

export function isVehicleStatus(value: string): value is VehicleStatus {
  return (VEHICLE_STATUSES as readonly string[]).includes(value);
}

export function isRentalStatus(value: string): value is RentalStatus {
  return (RENTAL_STATUSES as readonly string[]).includes(value);
}

export function vehicleStatusLabel(status: VehicleStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "on_rent":
      return "On rent";
    case "attention":
      return "Needs attention";
    case "maintenance":
      return "Maintenance";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function rentalStatusLabel(status: RentalStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "on_rent":
      return "On rent";
    case "on_hold":
      return "On hold";
    case "closed":
      return "Closed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function vehicleStatusTone(status: VehicleStatus): string {
  switch (status) {
    case "available":
      return "badge-available";
    case "on_rent":
      return "badge-on-rent";
    case "attention":
      return "badge-attention";
    case "maintenance":
      return "badge-maintenance";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function rentalStatusTone(status: RentalStatus): string {
  switch (status) {
    case "draft":
      return "badge-draft";
    case "on_rent":
      return "badge-on-rent";
    case "on_hold":
      return "badge-hold";
    case "closed":
      return "badge-closed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
