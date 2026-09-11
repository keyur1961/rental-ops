import { updateOwnerProfile } from "@/app/actions/profile";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const owner = await prisma.ownerProfile.findUnique({ where: { id: "default" } });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-brass">Business profile</p>
        <h1 className="display text-4xl font-semibold">Owner details</h1>
        <p className="mt-1 max-w-2xl text-ink-soft">
          These details prefill every hire agreement. Keep the terms as placeholders until a lawyer has written yours.
        </p>
      </div>

      <form action={updateOwnerProfile} className="card space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Business name</span>
            <input className="field" name="businessName" defaultValue={owner?.businessName ?? ""} required />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">ABN (optional)</span>
            <input className="field" name="abn" defaultValue={owner?.abn ?? ""} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Phone</span>
            <input className="field" name="phone" defaultValue={owner?.phone ?? ""} required />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Address</span>
            <input className="field" name="address" defaultValue={owner?.address ?? ""} required />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input className="field" type="email" name="email" defaultValue={owner?.email ?? ""} required />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Hold period (days)</span>
            <input className="field" type="number" min={5} max={14} name="holdPeriodDays" defaultValue={owner?.holdPeriodDays ?? 6} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Bank / payment notes</span>
            <textarea className="field min-h-24" name="bankNotes" defaultValue={owner?.bankNotes ?? ""} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Standard terms</span>
            <textarea className="field min-h-64" name="standardTerms" defaultValue={owner?.standardTerms ?? ""} />
          </label>
        </div>
        <button className="btn btn-primary" type="submit">
          Save owner profile
        </button>
      </form>
    </div>
  );
}
