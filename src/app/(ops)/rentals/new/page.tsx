import { createRental } from "@/app/actions/rentals";
import { addDays, toDateTimeLocalValue } from "@/lib/dates";
import { prisma } from "@/lib/db";

export default async function NewRentalPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const { vehicleId } = await searchParams;
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { in: ["available", "attention"] } },
    orderBy: { rego: "asc" },
  });

  const start = new Date();
  const end = addDays(start, 3);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-brass">New hire</p>
        <h1 className="display text-4xl font-semibold">Pick a car</h1>
        <p className="mt-1 text-ink-soft">Then photograph the licence. Almost no typing after that.</p>
      </div>

      {vehicles.length === 0 ? (
        <p className="card p-4 text-sm">No cars are free to hire. Check the fleet board.</p>
      ) : (
        <form action={createRental} className="card space-y-4 p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Vehicle</span>
            <select className="field" name="vehicleId" defaultValue={vehicleId ?? vehicles[0]?.id} required>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.rego} · {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.status.replaceAll("_", " ")})
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Start</span>
              <input className="field" type="datetime-local" name="plannedStart" defaultValue={toDateTimeLocalValue(start)} required />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Due back</span>
              <input className="field" type="datetime-local" name="plannedEnd" defaultValue={toDateTimeLocalValue(end)} required />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Notes</span>
            <input className="field" name="notes" placeholder="Airport drop, extra driver, child seat…" />
          </label>
          <button className="btn btn-accent w-full" type="submit">
            Continue to licence
          </button>
        </form>
      )}
    </div>
  );
}
