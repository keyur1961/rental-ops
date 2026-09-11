"use client";

import { useActionState } from "react";
import { submitTokenOdometer } from "@/app/actions/maintenance";

export function TokenOdometerForm({ token, rego }: { token: string; rego: string }) {
  const bound = submitTokenOdometer.bind(null, token);
  const [state, action] = useActionState(bound, undefined);

  if (state?.ok) {
    return (
      <p className="card p-4 text-sm">
        Thanks — the odometer for {rego} is in. You can close this page.
      </p>
    );
  }

  return (
    <form action={action} className="card space-y-3 p-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Kilometres showing</span>
        <input className="field" type="number" name="km" required />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Photo of the odometer</span>
        <input className="field" type="file" name="file" accept="image/*" capture="environment" required />
      </label>
      <button className="btn btn-primary w-full" type="submit">
        Send reading
      </button>
      {state?.error ? <p className="text-sm text-maintenance">{state.error}</p> : null}
    </form>
  );
}
