import Link from "next/link";
import { RentalBadge, VehicleBadge } from "@/components/StatusBadge";
import { formatAuDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { asRentalStatus, asVehicleStatus } from "@/lib/guards";
import { dueItems, dueLabels, kmUntilLabel } from "@/lib/maintenance";
import { formatAud } from "@/lib/money";

export default async function DashboardPage() {
  const [vehicles, onRent, holds, owner] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { rego: "asc" } }),
    prisma.rental.findMany({
      where: { status: "on_rent" },
      include: { vehicle: true },
      orderBy: { plannedEnd: "asc" },
    }),
    prisma.rental.findMany({
      where: { status: "on_hold" },
      include: { vehicle: true, charges: true },
      orderBy: { holdUntil: "asc" },
    }),
    prisma.ownerProfile.findUnique({ where: { id: "default" } }),
  ]);

  const attention = vehicles.filter((vehicle) => vehicle.status === "attention" || dueItems(vehicle).length > 0);
  // Server dashboard is force-dynamic; wall-clock is the point of "due back soon".
  // eslint-disable-next-line react-hooks/purity -- live ops board, not a cached render
  const upcoming = onRent.filter((rental) => rental.plannedEnd.getTime() - Date.now() < 1000 * 60 * 60 * 48);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brass">Today on the river</p>
          <h1 className="display text-4xl font-semibold">{owner?.businessName ?? "Rental Ops"}</h1>
          <p className="mt-1 max-w-xl text-ink-soft">
            Cars on hire, cars that need a look, and holds waiting on tolls. Start a hire from a photo, not a spreadsheet.
          </p>
        </div>
        <Link href="/rentals/new" className="btn btn-accent">
          Start a hire
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="On rent" value={onRent.length} href="/" />
        <Stat label="Attention" value={attention.length} href="/maintenance" />
        <Stat label="Open holds" value={holds.length} href="/" />
        <Stat label="Due back soon" value={upcoming.length} href="/" />
      </section>

      <BoardSection title="Cars on rent" empty="Nothing out at the moment.">
        {onRent.map((rental) => (
          <Link key={rental.id} href={`/rentals/${rental.id}`} className="card block p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {rental.vehicle.rego} · {rental.vehicle.make} {rental.vehicle.model}
                </p>
                <p className="text-sm text-ink-soft">{rental.renterName || "Renter details pending"}</p>
              </div>
              <RentalBadge status={asRentalStatus(rental.status)} />
            </div>
            <p className="mt-2 text-sm">Back {formatAuDateTime(rental.plannedEnd)}</p>
          </Link>
        ))}
      </BoardSection>

      <BoardSection title="Needs attention" empty="No service or tyre flags.">
        {attention.map((vehicle) => {
          const items = dueLabels(dueItems(vehicle));
          return (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} className="card block p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {vehicle.rego} · {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-sm text-ink-soft">{items.join(" · ") || "Marked for attention"}</p>
                </div>
                <VehicleBadge status={asVehicleStatus(vehicle.status)} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {vehicle.odometerKm.toLocaleString("en-AU")} km · service{" "}
                {kmUntilLabel(vehicle.odometerKm, vehicle.lastServiceKm, vehicle.serviceIntervalKm)}
              </p>
            </Link>
          );
        })}
      </BoardSection>

      <BoardSection title="Open holds" empty="No post-return holds open.">
        {holds.map((rental) => {
          const total = rental.charges.reduce((sum, charge) => sum + charge.amountCents, 0);
          return (
            <Link key={rental.id} href={`/rentals/${rental.id}`} className="card block p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {rental.vehicle.rego} · {rental.renterName}
                  </p>
                  <p className="text-sm text-ink-soft">
                    Hold until {rental.holdUntil ? formatAuDateTime(rental.holdUntil) : "—"}
                  </p>
                </div>
                <RentalBadge status={asRentalStatus(rental.status)} />
              </div>
              <p className="mt-2 text-sm">{total > 0 ? formatAud(total) : "No extra charges yet"}</p>
            </Link>
          );
        })}
      </BoardSection>

      <BoardSection title="Upcoming ends" empty="No hires finishing in the next 48 hours.">
        {upcoming.map((rental) => (
          <Link key={rental.id} href={`/rentals/${rental.id}`} className="card block p-4">
            <p className="font-semibold">
              {rental.vehicle.rego} · {rental.renterName || "Draft hire"}
            </p>
            <p className="text-sm text-ink-soft">Due {formatAuDateTime(rental.plannedEnd)}</p>
          </Link>
        ))}
      </BoardSection>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="display mt-1 text-3xl font-semibold">{value}</p>
    </Link>
  );
}

function BoardSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : children ? [children] : [];
  return (
    <section className="space-y-3">
      <h2 className="display text-2xl font-semibold">{title}</h2>
      {items.filter(Boolean).length === 0 ? (
        <p className="card p-4 text-sm text-ink-soft">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
      )}
    </section>
  );
}
