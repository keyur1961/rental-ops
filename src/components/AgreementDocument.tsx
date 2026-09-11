import type { OwnerProfile, Rental, Vehicle } from "@prisma/client";
import { formatAuDateTime } from "@/lib/dates";

export function AgreementDocument({
  owner,
  rental,
  vehicle,
}: {
  owner: OwnerProfile;
  rental: Rental;
  vehicle: Vehicle;
}) {
  return (
    <article className="print-sheet space-y-5 bg-white p-6 text-ink sm:p-10">
      <header className="border-b border-rule pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brass">Private vehicle hire</p>
        <h1 className="display mt-1 text-3xl font-semibold">{owner.businessName}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {owner.address}
          {owner.abn ? ` · ABN ${owner.abn}` : ""}
        </p>
        <p className="text-sm text-ink-soft">
          {owner.phone} · {owner.email}
        </p>
      </header>

      <section>
        <h2 className="display text-xl font-semibold">Hire agreement</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Hire {rental.id.slice(-6).toUpperCase()} · {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.rego}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Owner / operator</h3>
          <p className="mt-1 whitespace-pre-line text-sm">
            {owner.businessName}
            {"\n"}
            {owner.address}
            {"\n"}
            {owner.phone}
            {"\n"}
            {owner.email}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Hirer</h3>
          <p className="mt-1 whitespace-pre-line text-sm">
            {rental.renterName || "—"}
            {"\n"}
            Licence {rental.renterLicenceNumber || "—"} · Class {rental.renterLicenceClass || "—"}
            {"\n"}
            Expiry {rental.renterLicenceExpiry || "—"} · DOB {rental.renterDob || "—"}
            {"\n"}
            {rental.renterAddress || "—"}
            {"\n"}
            Mobile {rental.renterMobile || "—"}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Vehicle</h3>
          <p className="mt-1 text-sm">
            {vehicle.year} {vehicle.make} {vehicle.model}, {vehicle.colour}. Rego {vehicle.rego}
            {vehicle.vin ? `. VIN ${vehicle.vin}` : ""}.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Period</h3>
          <p className="mt-1 text-sm">
            {formatAuDateTime(rental.plannedStart)} to {formatAuDateTime(rental.plannedEnd)}
          </p>
          <p className="mt-1 text-sm">
            Handover odometer: {rental.startOdometerKm ?? "—"} km · Fuel: {rental.startFuel ?? "—"}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Payment notes</h3>
        <p className="mt-1 whitespace-pre-line text-sm">{owner.bankNotes}</p>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Standard terms</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-6">{owner.standardTerms}</p>
      </section>

      <section className="grid grid-cols-1 gap-8 pt-6 sm:grid-cols-2">
        <div>
          <div className="h-16 border-b border-ink/40" />
          <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft">Hirer signature / name</p>
        </div>
        <div>
          <div className="h-16 border-b border-ink/40" />
          <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft">Owner signature / name</p>
        </div>
      </section>
    </article>
  );
}
