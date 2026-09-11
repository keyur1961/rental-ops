"use client";

import { useActionState } from "react";
import { returnRental } from "@/app/actions/rentals";
import { CONDITION_SLOTS, FUEL_LEVELS } from "@/lib/constants";
import { PhotoChecklist } from "@/components/PhotoChecklist";

type ExistingPhoto = { slot: string; relativePath: string };

export function ReturnForm({
  rentalId,
  existingPhotos,
  defaultOdometer,
  defaultHoldDays,
}: {
  rentalId: string;
  existingPhotos: ExistingPhoto[];
  defaultOdometer: number;
  defaultHoldDays: number;
}) {
  const [state, action] = useActionState(returnRental, undefined);

  return (
    <div className="space-y-4">
      <PhotoChecklist
        rentalId={rentalId}
        category="return"
        slots={CONDITION_SLOTS}
        existing={existingPhotos}
      />
      <form action={action} className="card space-y-3 p-4">
        <input type="hidden" name="rentalId" value={rentalId} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Return odometer (km)</span>
            <input className="field" type="number" name="returnOdometerKm" defaultValue={defaultOdometer} required />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Fuel</span>
            <select className="field" name="returnFuel" defaultValue="Full" required>
              {FUEL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Hold period (days)</span>
            <input
              className="field"
              type="number"
              min={1}
              max={21}
              name="holdPeriodDays"
              defaultValue={defaultHoldDays}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Return notes</span>
            <input className="field" name="notes" placeholder="Scratches, missing fuel, late…" />
          </label>
        </div>
        <button className="btn btn-accent w-full" type="submit">
          Take the car back and start hold
        </button>
        {state?.error ? <p className="text-sm text-maintenance">{state.error}</p> : null}
      </form>
    </div>
  );
}
