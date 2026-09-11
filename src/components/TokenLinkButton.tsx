"use client";

import { useState } from "react";
import { createOdometerToken } from "@/app/actions/maintenance";
import { smsStubMessage } from "@/lib/maintenance";

export function TokenLinkButton({ vehicleId, rego }: { vehicleId: string; rego: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("vehicleId", vehicleId);
    const result = await createOdometerToken(formData);
    setBusy(false);
    if (result.error || !result.url) {
      setError(result.error ?? "Could not make a link.");
      return;
    }
    const absolute = `${window.location.origin}${result.url}`;
    setMessage(smsStubMessage(rego, absolute));
  }

  return (
    <div className="space-y-2">
      <button className="btn btn-ghost w-full" type="button" onClick={() => void onCreate()} disabled={busy}>
        {busy ? "Making link…" : "Make SMS odometer link"}
      </button>
      {message ? (
        <div className="rounded-lg bg-paper p-3 text-sm">
          <p className="font-medium">SMS is not connected. Copy this and send it yourself:</p>
          <p className="mt-2 break-words">{message}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-maintenance">{error}</p> : null}
    </div>
  );
}
