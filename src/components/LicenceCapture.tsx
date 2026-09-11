"use client";

import { useActionState, useRef, useState } from "react";
import { saveRenterDetails } from "@/app/actions/rentals";
import { uploadRentalPhoto } from "@/app/actions/photos";
import { LICENCE_SLOTS } from "@/lib/constants";
import { fileUrl } from "@/lib/files";
import { filledLicenceFields, LICENCE_FIELD_LABELS, type LicenceFieldKey } from "@/lib/ocr/fields";
import { fileForUpload, prepareImageForOcr } from "@/lib/ocr/prepare-image-client";
import type { LicenceFields, LicenceOcrResult } from "@/lib/ocr/types";

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

type OcrStatus =
  | { kind: "reading" }
  | { kind: "ok"; filled: number }
  | { kind: "partial"; filled: number; missing: string[] }
  | { kind: "empty" }
  | { kind: "error"; message: string };

const OCR_TIMEOUT_MS = 50_000;

function statusClass(kind: OcrStatus["kind"]): string {
  switch (kind) {
    case "reading":
      return "text-sm text-ink-soft";
    case "ok":
      return "text-sm font-medium text-available";
    case "partial":
      return "text-sm font-medium text-attention";
    case "empty":
    case "error":
      return "text-sm font-medium text-maintenance";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function statusText(status: OcrStatus): string {
  switch (status.kind) {
    case "reading":
      return "Reading the licence… this can take a moment the first time.";
    case "ok":
      return `Filled ${status.filled} fields from the photo. Check them — OCR is a starting point, not gospel.`;
    case "partial":
      return `Partial read (${status.filled} fields). Check what filled and type ${status.missing.join(", ")}.`;
    case "empty":
      return "Could not extract licence details from that photo. Type them below, or try a sharper, flatter shot of the card.";
    case "error":
      return status.message;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function describeOcr(result: LicenceOcrResult): OcrStatus {
  const filled = result.filledFields ?? [];
  if (filled.length === 0) return { kind: "empty" };
  const missing = (Object.keys(LICENCE_FIELD_LABELS) as LicenceFieldKey[])
    .filter((key) => !filled.includes(key))
    .map((key) => LICENCE_FIELD_LABELS[key]);
  if (result.licenceNumber && filled.length >= 3) {
    return { kind: "ok", filled: filled.length };
  }
  return { kind: "partial", filled: filled.length, missing };
}

export function LicenceCapture({ rentalId, existingPhotos, initial, locked }: Props) {
  const [fields, setFields] = useState(initial);
  const fieldsRef = useRef(initial);
  const [paths, setPaths] = useState<Record<string, string>>(() =>
    Object.fromEntries(existingPhotos.map((photo) => [photo.slot, photo.relativePath])),
  );
  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [state, action] = useActionState(saveRenterDetails, undefined);

  function setField<K extends keyof typeof fields>(key: K, value: string) {
    setFields((current) => {
      const next = { ...current, [key]: value };
      fieldsRef.current = next;
      return next;
    });
  }

  async function onLicenceFile(slot: string, file: File | undefined) {
    if (!file || locked) return;

    try {
      const uploadFile = await fileForUpload(file);
      const formData = new FormData();
      formData.set("rentalId", rentalId);
      formData.set("category", "licence");
      formData.set("slot", slot);
      formData.set("file", uploadFile);
      const upload = await uploadRentalPhoto(formData);
      if (upload.path) {
        setPaths((current) => ({ ...current, [slot]: upload.path as string }));
      }
    } catch {
      // Still try OCR even if the photo did not persist.
    }

    setOcrStatus({ kind: "reading" });
    setShowRaw(false);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

    try {
      const ocrFile = await prepareImageForOcr(file);
      const ocrData = new FormData();
      ocrData.set("image", ocrFile);
      const response = await fetch("/api/ocr", { method: "POST", body: ocrData, signal: controller.signal });
      let result: (LicenceFields & LicenceOcrResult & { error?: string }) | null = null;
      try {
        result = (await response.json()) as LicenceFields & LicenceOcrResult & { error?: string };
      } catch {
        setOcrStatus({
          kind: "error",
          message: "OCR returned an unexpected response. Fill the fields by hand.",
        });
        setShowRaw(true);
        return;
      }

      if (!response.ok || result.error) {
        setOcrStatus({
          kind: "error",
          message: result.error ?? "Could not read that photo. Fill the fields by hand.",
        });
        setRawText(result.rawText ?? null);
        setShowRaw(true);
        return;
      }

      const current = fieldsRef.current;
      const nextFields = {
        renterName: result.name || current.renterName,
        renterLicenceNumber: result.licenceNumber || current.renterLicenceNumber,
        renterLicenceExpiry: result.expiry || current.renterLicenceExpiry,
        renterAddress: result.address || current.renterAddress,
        renterDob: result.dob || current.renterDob,
        renterLicenceClass: result.licenceClass || current.renterLicenceClass,
        renterMobile: current.renterMobile,
      };
      fieldsRef.current = nextFields;
      setFields(nextFields);
      setRawText(result.rawText ?? null);
      const next = describeOcr({
        ...result,
        name: nextFields.renterName,
        licenceNumber: nextFields.renterLicenceNumber,
        expiry: nextFields.renterLicenceExpiry,
        address: nextFields.renterAddress,
        dob: nextFields.renterDob,
        licenceClass: nextFields.renterLicenceClass,
        filledFields: filledLicenceFields({
          name: nextFields.renterName,
          licenceNumber: nextFields.renterLicenceNumber,
          expiry: nextFields.renterLicenceExpiry,
          address: nextFields.renterAddress,
          dob: nextFields.renterDob,
          licenceClass: nextFields.renterLicenceClass,
        }),
      });
      setOcrStatus(next);
      setShowRaw(next.kind !== "ok");
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setOcrStatus({
        kind: "error",
        message: aborted
          ? "OCR timed out on the phone connection. Fill the fields by hand, or try again on a stronger signal."
          : "Could not reach OCR. Fill the fields by hand.",
      });
      setShowRaw(true);
    } finally {
      window.clearTimeout(timer);
    }
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

      {ocrStatus ? <p className={statusClass(ocrStatus.kind)}>{statusText(ocrStatus)}</p> : null}

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
        <details
          className="text-sm text-ink-soft"
          open={showRaw}
          onToggle={(event) => setShowRaw(event.currentTarget.open)}
        >
          <summary className="cursor-pointer font-medium">OCR raw text</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-paper p-3">{rawText}</pre>
        </details>
      ) : ocrStatus && ocrStatus.kind !== "reading" ? (
        <p className="text-sm text-ink-soft">No readable text came back from that photo.</p>
      ) : null}
    </div>
  );
}
