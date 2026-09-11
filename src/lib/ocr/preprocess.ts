import heicConvert from "heic-convert";
import sharp from "sharp";

const MAX_EDGE = 2000;

const HEIC_BRANDS = ["heic", "heif", "heix", "hevc", "hevx", "mif1", "msf1"];

export function isHeicBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const box = buffer.toString("ascii", 4, 8);
  if (box !== "ftyp") return false;
  const brand = buffer.toString("ascii", 8, 12).toLowerCase();
  return HEIC_BRANDS.includes(brand);
}

async function heicToJpeg(buffer: Buffer): Promise<Buffer> {
  const output = await heicConvert({ buffer, format: "JPEG", quality: 0.9 });
  return Buffer.from(output);
}

async function toDecodableJpeg(buffer: Buffer): Promise<Buffer> {
  if (!isHeicBuffer(buffer)) return buffer;
  try {
    return await heicToJpeg(buffer);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new Error(
      `This photo is HEIC/HEIF and could not be converted for OCR (${detail}). Photograph again or use a JPEG.`,
    );
  }
}

export async function preprocessOcrImage(image: Buffer | Uint8Array): Promise<Buffer> {
  const input = await toDecodableJpeg(Buffer.from(image));
  try {
    return await sharp(input)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .grayscale()
      .normalise()
      .linear(1.2, -16)
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (error) {
    if (isHeicBuffer(Buffer.from(image))) {
      throw new Error("This photo is HEIC/HEIF and could not be read for OCR. Photograph again or use a JPEG.");
    }
    const detail = error instanceof Error ? error.message : "Could not read that image.";
    throw new Error(detail);
  }
}

export async function rotateJpeg(image: Buffer, degrees: 90 | 180 | 270): Promise<Buffer> {
  return sharp(image).rotate(degrees).jpeg({ quality: 90 }).toBuffer();
}
