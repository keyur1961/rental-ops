"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { DEFAULT_HOLD_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/db";

export async function updateOwnerProfile(formData: FormData): Promise<void> {
  await requireSession();

  const holdPeriodDays = Number.parseInt(String(formData.get("holdPeriodDays") ?? DEFAULT_HOLD_DAYS), 10);

  await prisma.ownerProfile.upsert({
    where: { id: "default" },
    update: {
      businessName: String(formData.get("businessName") ?? "").trim(),
      abn: String(formData.get("abn") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      bankNotes: String(formData.get("bankNotes") ?? "").trim(),
      standardTerms: String(formData.get("standardTerms") ?? "").trim(),
      holdPeriodDays: Number.isFinite(holdPeriodDays) ? holdPeriodDays : DEFAULT_HOLD_DAYS,
    },
    create: {
      id: "default",
      businessName: String(formData.get("businessName") ?? "").trim(),
      abn: String(formData.get("abn") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      bankNotes: String(formData.get("bankNotes") ?? "").trim(),
      standardTerms: String(formData.get("standardTerms") ?? "").trim(),
      holdPeriodDays: Number.isFinite(holdPeriodDays) ? holdPeriodDays : DEFAULT_HOLD_DAYS,
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}
