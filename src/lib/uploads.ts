import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { PhotoCategory } from "@/lib/constants";
import { fileUrl as publicFileUrl } from "@/lib/files";
import { resolveUploadRoot } from "@/lib/paths";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);

export function uploadRoot(): string {
  return resolveUploadRoot();
}

export function rentalFolder(rentalId: string, category: PhotoCategory): string {
  return path.join(uploadRoot(), "rentals", rentalId, category);
}

export function vehicleOdometerFolder(vehicleId: string): string {
  return path.join(uploadRoot(), "vehicles", vehicleId, "odometer");
}

export function extensionFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

export function safeRelativePath(relativePath: string): string {
  const normalised = path.normalize(relativePath).replace(/^[/\\]+/, "");
  if (normalised.startsWith("..") || path.isAbsolute(normalised)) {
    throw new Error("Invalid upload path");
  }
  return normalised;
}

export function absoluteFromRelative(relativePath: string): string {
  return path.join(uploadRoot(), safeRelativePath(relativePath));
}

export async function saveBuffer(options: {
  directory: string;
  filename: string;
  data: Buffer;
}): Promise<string> {
  await mkdir(options.directory, { recursive: true });
  const fullPath = path.join(options.directory, options.filename);
  await writeFile(fullPath, options.data);
  return path.relative(uploadRoot(), fullPath).split(path.sep).join("/");
}

export async function saveRentalPhoto(options: {
  rentalId: string;
  category: PhotoCategory;
  slot: string;
  file: File;
}): Promise<string> {
  const ext = extensionFromName(options.file.name);
  const filename = `${options.slot}-${randomBytes(4).toString("hex")}.${ext}`;
  const directory = rentalFolder(options.rentalId, options.category);
  const data = Buffer.from(await options.file.arrayBuffer());
  return saveBuffer({ directory, filename, data });
}

export async function saveVehicleOdometerPhoto(options: {
  vehicleId: string;
  rentalId?: string;
  file: File;
}): Promise<string> {
  const ext = extensionFromName(options.file.name);
  const filename = `odometer-${Date.now()}-${randomBytes(3).toString("hex")}.${ext}`;
  const data = Buffer.from(await options.file.arrayBuffer());

  if (options.rentalId) {
    return saveBuffer({
      directory: rentalFolder(options.rentalId, "odometer"),
      filename,
      data,
    });
  }

  return saveBuffer({
    directory: vehicleOdometerFolder(options.vehicleId),
    filename,
    data,
  });
}

export async function removeUpload(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;
  try {
    await unlink(absoluteFromRelative(relativePath));
  } catch {
    // File may already be gone.
  }
}

export const fileUrl = publicFileUrl;
