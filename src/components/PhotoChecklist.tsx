"use client";

import { useState } from "react";
import { uploadRentalPhoto } from "@/app/actions/photos";
import type { PhotoCategory } from "@/lib/constants";
import { fileUrl } from "@/lib/files";

type Slot = { id: string; label: string };

type ExistingPhoto = {
  slot: string;
  relativePath: string;
};

export function PhotoChecklist({
  rentalId,
  category,
  slots,
  existing,
}: {
  rentalId: string;
  category: PhotoCategory;
  slots: readonly Slot[];
  existing: ExistingPhoto[];
}) {
  const [paths, setPaths] = useState<Record<string, string>>(() =>
    Object.fromEntries(existing.map((photo) => [photo.slot, photo.relativePath])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(slot: string, file: File | undefined) {
    if (!file) return;
    setBusy(slot);
    setError(null);
    const formData = new FormData();
    formData.set("rentalId", rentalId);
    formData.set("category", category);
    formData.set("slot", slot);
    formData.set("file", file);
    const result = await uploadRentalPhoto(formData);
    if (result.error) {
      setError(result.error);
    } else if (result.path) {
      setPaths((current) => ({ ...current, [slot]: result.path as string }));
    }
    setBusy(null);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slots.map((slot) => {
          const path = paths[slot.id];
          return (
            <label key={slot.id} className="card block overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm font-semibold">{slot.label}</span>
                <span className="text-xs text-ink-soft">{path ? "Captured" : "Needed"}</span>
              </div>
              {path ? (
                // Local ops uploads are served through /api/files, not next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(path)} alt={slot.label} className="h-40 w-full object-cover bg-paper" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-paper text-sm text-ink-soft">
                  {busy === slot.id ? "Saving…" : "Tap to photograph"}
                </div>
              )}
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  void onFile(slot.id, event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          );
        })}
      </div>
      {error ? <p className="text-sm text-maintenance">{error}</p> : null}
    </div>
  );
}
