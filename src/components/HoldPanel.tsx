"use client";

import { useActionState } from "react";
import { addCharge, releaseHold } from "@/app/actions/rentals";
import { CHARGE_PRESETS } from "@/lib/constants";
import { formatAuDateTime } from "@/lib/dates";
import { formatAud } from "@/lib/money";

type Charge = { id: string; description: string; amountCents: number; createdAt: Date };

export function HoldPanel({
  rentalId,
  holdUntil,
  charges,
  closed,
}: {
  rentalId: string;
  holdUntil: Date | null;
  charges: Charge[];
  closed: boolean;
}) {
  const [chargeState, chargeAction] = useActionState(addCharge, undefined);
  const [releaseState, releaseAction] = useActionState(releaseHold, undefined);
  const total = charges.reduce((sum, charge) => sum + charge.amountCents, 0);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-ink-soft">
          Hold for delayed tolls and infringements
          {holdUntil ? ` until ${formatAuDateTime(holdUntil)}` : ""}.
        </p>
        <ul className="mt-3 space-y-2">
          {charges.length === 0 ? (
            <li className="text-sm text-ink-soft">No extra charges yet.</li>
          ) : (
            charges.map((charge) => (
              <li key={charge.id} className="flex items-center justify-between text-sm">
                <span>{charge.description}</span>
                <span className="font-semibold">{formatAud(charge.amountCents)}</span>
              </li>
            ))
          )}
        </ul>
        <p className="mt-3 text-sm font-semibold">Total {formatAud(total)}</p>
      </div>

      <form action={chargeAction} className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input type="hidden" name="rentalId" value={rentalId} />
        <label className="space-y-1 sm:col-span-1">
          <span className="text-sm font-medium">Charge type</span>
          <select className="field" name="description" defaultValue="Toll">
            {CHARGE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Amount (AUD)</span>
          <input className="field" name="amount" placeholder="12.80" required />
        </label>
        <div className="flex items-end">
          <button className="btn btn-ghost w-full" type="submit">
            Add charge
          </button>
        </div>
        {chargeState?.error ? <p className="text-sm text-maintenance sm:col-span-3">{chargeState.error}</p> : null}
      </form>

      {!closed ? (
        <form action={releaseAction}>
          <input type="hidden" name="rentalId" value={rentalId} />
          <button className="btn btn-primary w-full" type="submit">
            Release hold and close hire
          </button>
          {releaseState?.error ? <p className="mt-2 text-sm text-maintenance">{releaseState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
