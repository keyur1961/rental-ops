import Link from "next/link";
import { VehicleBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/db";
import { asVehicleStatus } from "@/lib/guards";
import { dueItems, dueLabels } from "@/lib/maintenance";

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { rego: "asc" },
    include: { rentals: { where: { status: { in: ["draft", "on_rent", "on_hold"] } }, take: 1 } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brass">Fleet</p>
          <h1 className="display text-4xl font-semibold">Cars</h1>
        </div>
        <Link href="/vehicles/new" className="btn btn-primary">
          Add a car
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {vehicles.map((vehicle) => {
          const flags = dueLabels(dueItems(vehicle));
          const open = vehicle.rentals[0];
          return (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {vehicle.rego} · {vehicle.colour} · {vehicle.odometerKm.toLocaleString("en-AU")} km
                  </p>
                  {flags.length > 0 ? <p className="mt-1 text-sm text-attention">{flags.join(" · ")}</p> : null}
                  {open ? (
                    <p className="mt-1 text-sm text-ink-soft">
                      Open hire {open.id.slice(-6).toUpperCase()}
                    </p>
                  ) : null}
                </div>
                <VehicleBadge status={asVehicleStatus(vehicle.status)} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
