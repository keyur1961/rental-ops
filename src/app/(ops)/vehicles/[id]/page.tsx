import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteVehicle, updateVehicle } from "@/app/actions/vehicles";
import { markServiceDone, markTyresDone } from "@/app/actions/maintenance";
import { VehicleForm } from "@/components/VehicleForm";
import { OdometerUpload } from "@/components/OdometerUpload";
import { TokenLinkButton } from "@/components/TokenLinkButton";
import { RentalBadge, VehicleBadge } from "@/components/StatusBadge";
import { formatAuDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { asRentalStatus, asVehicleStatus } from "@/lib/guards";
import { dueItems, dueLabels, kmUntil } from "@/lib/maintenance";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      rentals: { orderBy: { createdAt: "desc" }, take: 8 },
      odometerReadings: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!vehicle) notFound();

  const flags = dueLabels(dueItems(vehicle));
  const canHire = vehicle.status === "available" || vehicle.status === "attention";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brass">{vehicle.rego}</p>
          <h1 className="display text-4xl font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-1 text-ink-soft">
            {vehicle.colour}
            {vehicle.vin ? ` · VIN ${vehicle.vin}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VehicleBadge status={asVehicleStatus(vehicle.status)} />
          {canHire ? (
            <Link href={`/rentals/new?vehicleId=${vehicle.id}`} className="btn btn-accent">
              Start hire
            </Link>
          ) : null}
        </div>
      </div>

      {flags.length > 0 ? (
        <div className="card p-4">
          <p className="font-semibold">{flags.join(" · ")}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Service in {kmUntil(vehicle.odometerKm, vehicle.lastServiceKm, vehicle.serviceIntervalKm).toLocaleString("en-AU")} km ·
            tyres in {kmUntil(vehicle.odometerKm, vehicle.lastTyreKm, vehicle.tyreIntervalKm).toLocaleString("en-AU")} km
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={markServiceDone}>
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <button className="btn btn-ghost" type="submit">
                Mark service done
              </button>
            </form>
            <form action={markTyresDone}>
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <button className="btn btn-ghost" type="submit">
                Mark tyres done
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card space-y-3 p-4">
          <h2 className="display text-2xl font-semibold">Odometer</h2>
          <p className="text-sm text-ink-soft">Current {vehicle.odometerKm.toLocaleString("en-AU")} km</p>
          <OdometerUpload vehicleId={vehicle.id} currentKm={vehicle.odometerKm} />
          <TokenLinkButton vehicleId={vehicle.id} rego={vehicle.rego} />
        </section>
        <section className="card space-y-3 p-4">
          <h2 className="display text-2xl font-semibold">Recent readings</h2>
          {vehicle.odometerReadings.length === 0 ? (
            <p className="text-sm text-ink-soft">No extra readings yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {vehicle.odometerReadings.map((reading) => (
                <li key={reading.id} className="flex justify-between gap-3">
                  <span>
                    {reading.km.toLocaleString("en-AU")} km · {reading.source.replaceAll("_", " ")}
                  </span>
                  <span className="text-ink-soft">{formatAuDateTime(reading.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="display text-2xl font-semibold">Recent hires</h2>
        {vehicle.rentals.length === 0 ? (
          <p className="card p-4 text-sm text-ink-soft">No hires recorded for this car.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {vehicle.rentals.map((rental) => (
              <Link key={rental.id} href={`/rentals/${rental.id}`} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{rental.renterName || "Draft hire"}</p>
                  <p className="text-sm text-ink-soft">{formatAuDateTime(rental.plannedStart)}</p>
                </div>
                <RentalBadge status={asRentalStatus(rental.status)} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl font-semibold">Edit car</h2>
        <VehicleForm
          action={updateVehicle}
          submitLabel="Save changes"
          values={{
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            rego: vehicle.rego,
            vin: vehicle.vin ?? "",
            colour: vehicle.colour,
            odometerKm: vehicle.odometerKm,
            status: vehicle.status,
            serviceIntervalKm: vehicle.serviceIntervalKm,
            tyreIntervalKm: vehicle.tyreIntervalKm,
            lastServiceKm: vehicle.lastServiceKm,
            lastTyreKm: vehicle.lastTyreKm,
            notes: vehicle.notes,
          }}
        />
        <form action={deleteVehicle}>
          <input type="hidden" name="id" value={vehicle.id} />
          <button className="btn btn-danger" type="submit">
            Delete car
          </button>
        </form>
      </section>
    </div>
  );
}
