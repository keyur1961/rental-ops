export type DueItem = "service" | "tyres";

export type MaintenanceVehicle = {
  odometerKm: number;
  lastServiceKm: number;
  lastTyreKm: number;
  serviceIntervalKm: number;
  tyreIntervalKm: number;
  status: string;
};

export function dueItems(vehicle: MaintenanceVehicle): DueItem[] {
  const items: DueItem[] = [];
  if (vehicle.odometerKm >= vehicle.lastServiceKm + vehicle.serviceIntervalKm) {
    items.push("service");
  }
  if (vehicle.odometerKm >= vehicle.lastTyreKm + vehicle.tyreIntervalKm) {
    items.push("tyres");
  }
  return items;
}

export function dueLabels(items: DueItem[]): string[] {
  return items.map((item) => {
    switch (item) {
      case "service":
        return "Service due";
      case "tyres":
        return "Tyres due";
      default: {
        const exhaustive: never = item;
        return exhaustive;
      }
    }
  });
}

export function kmUntil(currentKm: number, lastKm: number, intervalKm: number): number {
  return lastKm + intervalKm - currentKm;
}

export function kmUntilLabel(currentKm: number, lastKm: number, intervalKm: number): string {
  const remaining = kmUntil(currentKm, lastKm, intervalKm);
  if (remaining >= 0) {
    return `in ${remaining.toLocaleString("en-AU")} km`;
  }
  return `${Math.abs(remaining).toLocaleString("en-AU")} km overdue`;
}

export function nextStatusAfterOdometer(
  vehicle: MaintenanceVehicle,
  nextKm: number,
): "available" | "attention" | "on_rent" | "maintenance" {
  if (vehicle.status === "on_rent" || vehicle.status === "maintenance") {
    return vehicle.status;
  }

  const preview = dueItems({ ...vehicle, odometerKm: nextKm });
  return preview.length > 0 ? "attention" : "available";
}

export function nextStatusAfterReturn(vehicle: MaintenanceVehicle): "available" | "attention" {
  return dueItems(vehicle).length > 0 ? "attention" : "available";
}

export function smsStubMessage(rego: string, url: string): string {
  return `Riverbend Motor Hire: please send a clear odometer photo for ${rego}. ${url}`;
}
