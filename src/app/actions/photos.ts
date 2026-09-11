"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { removeUpload, saveRentalPhoto } from "@/lib/uploads";

function isPhotoCategory(value: string): value is PhotoCategory {
  return (PHOTO_CATEGORIES as readonly string[]).includes(value);
}

export async function uploadRentalPhoto(formData: FormData): Promise<{ error?: string; path?: string }> {
  await requireSession();
  const rentalId = String(formData.get("rentalId") ?? "");
  const categoryValue = String(formData.get("category") ?? "");
  const slot = String(formData.get("slot") ?? "").trim();
  const file = formData.get("file");

  if (!isPhotoCategory(categoryValue)) {
    return { error: "Unknown photo folder." };
  }
  if (!slot) return { error: "Missing photo slot." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo." };
  }

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental) return { error: "Hire not found." };

  const existing = await prisma.photo.findUnique({
    where: {
      rentalId_category_slot: {
        rentalId,
        category: categoryValue,
        slot,
      },
    },
  });

  const relativePath = await saveRentalPhoto({
    rentalId,
    category: categoryValue,
    slot,
    file,
  });

  if (existing) {
    await removeUpload(existing.relativePath);
    await prisma.photo.update({
      where: { id: existing.id },
      data: { relativePath },
    });
  } else {
    await prisma.photo.create({
      data: {
        rentalId,
        category: categoryValue,
        slot,
        relativePath,
      },
    });
  }

  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath(`/rentals/${rentalId}/return`);
  return { path: relativePath };
}
