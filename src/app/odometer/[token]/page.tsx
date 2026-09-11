import { notFound } from "next/navigation";
import { TokenOdometerForm } from "@/components/TokenOdometerForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TokenOdometerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await prisma.odometerToken.findUnique({
    where: { token },
    include: { vehicle: true },
  });
  if (!record) notFound();

  // Token pages are force-dynamic; expiry is a wall-clock check.
  // eslint-disable-next-line react-hooks/purity -- live token expiry
  const expired = record.expiresAt.getTime() < Date.now();
  const used = Boolean(record.usedAt);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-brass">Riverbend Motor Hire</p>
      <h1 className="display mt-2 text-4xl font-semibold">Odometer for {record.vehicle.rego}</h1>
      <p className="mt-2 text-ink-soft">
        Take a straight-on photo of the kilometres and type the number you see.
      </p>
      <div className="mt-8">
        {used || expired ? (
          <p className="card p-4 text-sm">
            {used ? "This link has already been used." : "This link has expired. Ask ops for a new one."}
          </p>
        ) : (
          <TokenOdometerForm token={token} rego={record.vehicle.rego} />
        )}
      </div>
    </div>
  );
}
