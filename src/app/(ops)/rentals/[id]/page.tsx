import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementDocument } from "@/components/AgreementDocument";
import { HandoverForm } from "@/components/HandoverForm";
import { HoldPanel } from "@/components/HoldPanel";
import { LicenceCapture } from "@/components/LicenceCapture";
import { RentalBadge } from "@/components/StatusBadge";
import { formatAuDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { asRentalStatus } from "@/lib/guards";
import { fileUrl } from "@/lib/files";

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { vehicle: true, photos: true, charges: { orderBy: { createdAt: "asc" } } },
  });
  const owner = await prisma.ownerProfile.findUnique({ where: { id: "default" } });
  if (!rental || !owner) notFound();

  const status = asRentalStatus(rental.status);
  const licencePhotos = rental.photos.filter((photo) => photo.category === "licence");
  const handoverPhotos = rental.photos.filter((photo) => photo.category === "handover");
  const returnPhotos = rental.photos.filter((photo) => photo.category === "return");
  const locked = status !== "draft";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brass">Hire {rental.id.slice(-6).toUpperCase()}</p>
          <h1 className="display text-4xl font-semibold">
            {rental.vehicle.rego} · {rental.vehicle.make} {rental.vehicle.model}
          </h1>
          <p className="mt-1 text-ink-soft">
            {formatAuDateTime(rental.plannedStart)} → {formatAuDateTime(rental.plannedEnd)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RentalBadge status={status} />
          <Link href={`/rentals/${rental.id}/agreement`} className="btn btn-ghost">
            Print agreement
          </Link>
          {status === "on_rent" ? (
            <Link href={`/rentals/${rental.id}/return`} className="btn btn-accent">
              Take return
            </Link>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="display text-2xl font-semibold">1. Licence</h2>
        <LicenceCapture
          rentalId={rental.id}
          existingPhotos={licencePhotos}
          locked={locked}
          initial={{
            renterName: rental.renterName,
            renterLicenceNumber: rental.renterLicenceNumber,
            renterLicenceExpiry: rental.renterLicenceExpiry,
            renterAddress: rental.renterAddress,
            renterDob: rental.renterDob,
            renterLicenceClass: rental.renterLicenceClass,
            renterMobile: rental.renterMobile,
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="display text-2xl font-semibold">2. Agreement</h2>
        <p className="text-sm text-ink-soft">
          Prefills from the owner profile. Use print / save PDF on the agreement page.
        </p>
        <div className="overflow-hidden rounded-2xl border border-rule">
          <AgreementDocument owner={owner} rental={rental} vehicle={rental.vehicle} />
        </div>
      </section>

      {status === "draft" ? (
        <section className="space-y-3">
          <h2 className="display text-2xl font-semibold">3. Handover photos</h2>
          <p className="text-sm text-ink-soft">
            Front, rear, both sides, odometer, fuel, interiors, and damage are required before the car leaves.
          </p>
          <HandoverForm
            rentalId={rental.id}
            existingPhotos={handoverPhotos}
            defaultOdometer={rental.startOdometerKm ?? rental.vehicle.odometerKm}
          />
        </section>
      ) : null}

      {status !== "draft" ? (
        <section className="space-y-3">
          <h2 className="display text-2xl font-semibold">Handover pack</h2>
          <PhotoGrid photos={handoverPhotos} />
          <p className="text-sm text-ink-soft">
            Left at {rental.startOdometerKm?.toLocaleString("en-AU")} km · fuel {rental.startFuel}
            {rental.handedOverAt ? ` · ${formatAuDateTime(rental.handedOverAt)}` : ""}
          </p>
        </section>
      ) : null}

      {returnPhotos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="display text-2xl font-semibold">Return pack</h2>
          <PhotoGrid photos={returnPhotos} />
          <p className="text-sm text-ink-soft">
            Back at {rental.returnOdometerKm?.toLocaleString("en-AU")} km · fuel {rental.returnFuel}
          </p>
        </section>
      ) : null}

      {status === "on_hold" || status === "closed" ? (
        <section className="space-y-3">
          <h2 className="display text-2xl font-semibold">Hold for tolls & infringements</h2>
          <HoldPanel
            rentalId={rental.id}
            holdUntil={rental.holdUntil}
            charges={rental.charges}
            closed={status === "closed"}
          />
        </section>
      ) : null}
    </div>
  );
}

function PhotoGrid({ photos }: { photos: { id: string; slot: string; relativePath: string }[] }) {
  if (photos.length === 0) {
    return <p className="card p-4 text-sm text-ink-soft">No photos in this folder yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {photos.map((photo) => (
        <figure key={photo.id} className="card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl(photo.relativePath)} alt={photo.slot} className="h-32 w-full object-cover" />
          <figcaption className="px-2 py-1 text-xs capitalize text-ink-soft">{photo.slot}</figcaption>
        </figure>
      ))}
    </div>
  );
}
