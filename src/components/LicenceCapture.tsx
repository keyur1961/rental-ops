"use client";

import { useActionState, useState } from "react";
import { saveRenterDetails } from "@/app/actions/rentals";
import { uploadRentalPhoto } from "@/app/actions/photos";
import { LICENCE_SLOTS } from "@/lib/constants";
import { fileUrl } from "@/lib/files";
import type { LicenceFields } from "@/lib/ocr/types";

type ExistingPhoto = { slot: string; relativePath: string };

type Props = {
  rentalId: string;
  existingPhotos: ExistingPhoto[];
  initial: {
    renterName: string;
    renterLicenceNumber: string;
    renterLicenceExpiry: string;
    renterAddress: string;
    renterDob: string;
    renterLicenceClass: string;
    renterMobile: string;
  };
  locked?: boolean;
};

export function LicenceCapture({ rentalId, existingPhotos, initial, locked }: Props) {
  const [fields, setFields] = useState(initial);
  const [paths, setPaths] = useState<Record<string, string>>(() =>
    Object.fromEntries(existingPhotos.map((photo) => [photo.slot, photo.relativePath])),
  );
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [state, action] = useActionState(saveRenterDetails, undefined);

  function setField<K extends keyof typeof fields>(key: K, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function onLicenceFile(slot: string, file: File | undefined) {
    if (!file || locked) return;
    const formData = new FormData();
    formData.set("rentalId", rentalId);
    formData.set("category", "licence");
    formData.set("slot", slot);
    formData.set("file", file);
    const upload = await uploadRentalPhoto(formData);
    if (upload.path) {
      setPaths((current) => ({ ...current, [slot]: upload.path as string }));
    }

    setOcrStatus("Reading the licence… this can take a moment the first time.");
    const ocrData = new FormData();
    ocrData.set("image", file);
    const response = await fetch("/api/ocr", { method: "POST", body: ocrData });
    const result = (await response.json()) as LicenceFields & { rawText?: string; error?: string };
    if (!response.ok || result.error) {
      setOcrStatus(result.error ?? "Could not read that photo. Fill the fields by hand.");
      return;
    }

    setFields((current) => ({
      renterName: result.name || current.renterName,
      renterLicenceNumber: result.licenceNumber || current.renterLicenceNumber,
      renterLicenceExpiry: result.expiry || current.renterLicenceExpiry,
      renterAddress: result.address || current.renterAddress,
      renterDob: result.dob || current.renterDob,
      renterLicenceClass: result.licenceClass || current.renterLicenceClass,
      renterMobile: current.renterMobile,
    }));
    setRawText(result.rawText ?? null);
    setOcrStatus("Check the fields — OCR is a starting point, not gospel.");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LICENCE_SLOTS.map((slot) => (
          <label key={slot.id} className="card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold">
              <span>{slot.label}</span>
              <span className="text-xs font-medium text-ink-soft">{paths[slot.id] ? "Saved" : "Needed"}</span>
            </div>
            {paths[slot.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(paths[slot.id])} alt={slot.label} className="h-44 w-full object-cover bg-paper" />
            ) : (
              <div className="flex h-44 items-center justify-center bg-paper text-sm text-ink-soft">
                Photograph the card
              </div>
            )}
            {!locked ? (
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  void onLicenceFile(slot.id, event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            ) : null}
          </label>
        ))}
      </div>

      {ocrStatus ? <p className="text-sm text-ink-soft">{ocrStatus}</p> : null}

      <form action={action} className="card space-y-3 p-4">
        <input type="hidden" name="rentalId" value={rentalId} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Name</span>
            <input className="field" name="renterName" value={fields.renterName} onChange={(e) => setField("renterName", e.target.value)} disabled={locked} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Licence number</span>
            <input className="field" name="renterLicenceNumber" value={fields.renterLicenceNumber} onChange={(e) => setField("renterLicenceNumber", e.target.value)} disabled={locked} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Class</span>
            <input className="field" name="renterLicenceClass" value={fields.renterLicenceClass} onChange={(e) => setField("renterLicenceClass", e.target.value)} disabled={locked} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Expiry</span>
            <input className="field" name="renterLicenceExpiry" value={fields.renterLicenceExpiry} onChange={(e) => setField("renterLicenceExpiry", e.target.value)} disabled={locked} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Date of birth</span>
            <input className="field" name="renterDob" value={fields.renterDob} onChange={(e) => setField("renterDob", e.target.value)} disabled={locked} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Address</span>
            <input className="field" name="renterAddress" value={fields.renterAddress} onChange={(e) => setField("renterAddress", e.target.value)} disabled={locked} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Mobile (required)</span>
            <input className="field" name="renterMobile" value={fields.renterMobile} onChange={(e) => setField("renterMobile", e.target.value)} disabled={locked} required />
          </label>
        </div>
        {!locked ? (
          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            Save renter details
          </button>
        ) : null}
        {state?.error ? <p className="text-sm text-maintenance">{state.error}</p> : null}
      </form>

      {rawText ? (
        <details className="text-sm text-ink-soft">
          <summary className="cursor-pointer font-medium">OCR raw text</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-paper p-3">{rawText}</pre>
        </details>
      ) : null}
    </div>
  );
}
