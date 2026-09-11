"use client";

const MAX_EDGE = 2000;

function isHeicFile(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function canvasToJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare that photo for OCR.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/jpeg", 0.88);
  });
  if (!blob) throw new Error("Could not convert that photo to JPEG.");
  return blob;
}

export async function prepareImageForOcr(file: File): Promise<File> {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      try {
        const blob = await canvasToJpeg(bitmap, bitmap.width, bitmap.height);
        return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      } finally {
        bitmap.close();
      }
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        canvasToJpeg(image, image.naturalWidth, image.naturalHeight)
          .then(resolve)
          .catch(reject)
          .finally(() => URL.revokeObjectURL(url));
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not open that photo."));
      };
      image.src = url;
    });
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch (error) {
    if (isHeicFile(file)) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "This HEIC photo could not be converted. Try JPEG or photograph again.",
      );
    }
    return file;
  }
}

export async function fileForUpload(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  return prepareImageForOcr(file);
}
