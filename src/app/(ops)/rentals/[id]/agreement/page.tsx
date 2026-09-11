import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementDocument } from "@/components/AgreementDocument";
import { PrintButton } from "@/components/PrintButton";
import { prisma } from "@/lib/db";

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rental = await prisma.rental.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  const owner = await prisma.ownerProfile.findUnique({ where: { id: "default" } });
  if (!rental || !owner) notFound();

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/rentals/${rental.id}`} className="btn btn-ghost">
          Back to hire
        </Link>
        <PrintButton label="Print / save PDF" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-rule bg-white">
        <AgreementDocument owner={owner} rental={rental} vehicle={rental.vehicle} />
      </div>
    </div>
  );
}
