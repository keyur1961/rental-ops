export type { LicenceFields, LicenceOcrResult, OcrProvider } from "@/lib/ocr/types";
export { filledLicenceFields, mergeLicenceFields } from "@/lib/ocr/fields";
export { parseAuLicence } from "@/lib/ocr/parse-au-licence";
export { TesseractOcrProvider, createOcrProvider } from "@/lib/ocr/tesseract-provider";
