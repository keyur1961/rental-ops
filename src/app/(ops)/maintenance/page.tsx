import Link from "next/link";
import { OdometerUpload } from "@/components/OdometerUpload";
import { TokenLinkButton } from "@/components/TokenLinkButton";
import { VehicleBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/db";
import { asVehicleStatus } from "@/lib/guards";
import { dueItems, dueLabels, kmUntilLabel } from "@/lib/maintenance";

export default async function MaintenancePage() {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { rego: "asc" } });
  const flagged = vehicles.filter(
    (vehicle) => vehicle.status === "attention" || vehicle.status === "maintenance" || dueItems(vehicle).length > 0,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-brass">Workshop</p>
        <h1 className="display text-4xl font-semibold">Maintenance</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Upload an odometer photo after a long trip, or send a one-time link. SMS sending is stubbed — copy the message.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="display text-2xl font-semibold">Attention list</h2>
        {flagged.length === 0 ? (
          <p className="card p-4 text-sm text-ink-soft">Nothing due. Enjoy the quiet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {flagged.map((vehicle) => (
              <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {vehicle.rego} · {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-attention">{dueLabels(dueItems(vehicle)).join(" · ") || "In maintenance"}</p>
                  </div>
                  <VehicleBadge status={asVehicleStatus(vehicle.status)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl font-semibold">Odometer upload</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="card space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {vehicle.rego} · {vehicle.odometerKm.toLocaleString("en-AU")} km
                  </p>
                  <p className="text-sm text-ink-soft">
                    Service {kmUntilLabel(vehicle.odometerKm, vehicle.lastServiceKm, vehicle.serviceIntervalKm)}
                  </p>
                </div>
                <VehicleBadge status={asVehicleStatus(vehicle.status)} />
              </div>
              <OdometerUpload vehicleId={vehicle.id} currentKm={vehicle.odometerKm} />
              <TokenLinkButton vehicleId={vehicle.id} rego={vehicle.rego} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
