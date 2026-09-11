"use client";

import { useActionState } from "react";
import { handOverRental } from "@/app/actions/rentals";
import { CONDITION_SLOTS, FUEL_LEVELS } from "@/lib/constants";
import { PhotoChecklist } from "@/components/PhotoChecklist";

type ExistingPhoto = { slot: string; relativePath: string };

export function HandoverForm({
  rentalId,
  existingPhotos,
  defaultOdometer,
}: {
  rentalId: string;
  existingPhotos: ExistingPhoto[];
  defaultOdometer: number;
}) {
  const [state, action] = useActionState(handOverRental, undefined);

  return (
    <div className="space-y-4">
      <PhotoChecklist
        rentalId={rentalId}
        category="handover"
        slots={CONDITION_SLOTS}
        existing={existingPhotos}
      />
      <form action={action} className="card space-y-3 p-4">
        <input type="hidden" name="rentalId" value={rentalId} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Handover odometer (km)</span>
            <input className="field" type="number" name="startOdometerKm" defaultValue={defaultOdometer} required />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Fuel</span>
            <select className="field" name="startFuel" defaultValue="Full" required>
              {FUEL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn btn-accent w-full" type="submit">
          Hand over vehicle
        </button>
        {state?.error ? <p className="text-sm text-maintenance">{state.error}</p> : null}
      </form>
    </div>
  );
}
