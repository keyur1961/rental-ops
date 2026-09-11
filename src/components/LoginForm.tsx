"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block space-y-1">
        <span className="text-sm font-medium">Ops password</span>
        <input className="field" type="password" name="password" autoFocus required />
      </label>
      <button className="btn btn-primary w-full" type="submit">
        Open the board
      </button>
      {state?.error ? <p className="text-sm text-maintenance">{state.error}</p> : null}
      <p className="text-xs text-ink-soft">Default local password is rentalops.</p>
    </form>
  );
}
