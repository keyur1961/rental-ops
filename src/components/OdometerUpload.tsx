"use client";

import { useActionState } from "react";
import { recordOdometer } from "@/app/actions/maintenance";

export function OdometerUpload({ vehicleId, currentKm }: { vehicleId: string; currentKm: number }) {
  const [state, action] = useActionState(recordOdometer, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <label className="block space-y-1">
        <span className="text-sm font-medium">Odometer (km)</span>
        <input className="field" type="number" name="km" defaultValue={currentKm} required />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Odometer photo</span>
        <input className="field" type="file" name="file" accept="image/*" capture="environment" required />
      </label>
      <button className="btn btn-primary w-full" type="submit">
        Save reading
      </button>
      {state?.error ? <p className="text-sm text-maintenance">{state.error}</p> : null}
    </form>
  );
}
