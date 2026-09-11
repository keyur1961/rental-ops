import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReturnForm } from "@/components/ReturnForm";
import { prisma } from "@/lib/db";

export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { vehicle: true, photos: true },
  });
  const owner = await prisma.ownerProfile.findUnique({ where: { id: "default" } });
  if (!rental || !owner) notFound();
  if (rental.status !== "on_rent") {
    redirect(`/rentals/${rental.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/rentals/${rental.id}`} className="text-sm font-medium text-teal">
          Back to hire
        </Link>
        <h1 className="display mt-2 text-4xl font-semibold">Return {rental.vehicle.rego}</h1>
        <p className="mt-1 text-ink-soft">
          Photograph the car the same way you did at handover, then start the toll hold.
        </p>
      </div>
      <ReturnForm
        rentalId={rental.id}
        existingPhotos={rental.photos.filter((photo) => photo.category === "return")}
        defaultOdometer={rental.startOdometerKm ?? rental.vehicle.odometerKm}
        defaultHoldDays={owner.holdPeriodDays}
      />
    </div>
  );
}
