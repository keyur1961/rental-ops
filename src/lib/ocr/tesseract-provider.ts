import { createWorker, PSM, type Worker } from "tesseract.js";
import { filledLicenceFields, mergeLicenceFields } from "@/lib/ocr/fields";
import { parseAuLicence } from "@/lib/ocr/parse-au-licence";
import { preprocessOcrImage, rotateJpeg } from "@/lib/ocr/preprocess";
import type { LicenceOcrResult, OcrProvider } from "@/lib/ocr/types";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function recognize(image: Buffer, psm: PSM): Promise<string> {
  const worker = await getWorker();
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const result = await worker.recognize(image);
  return result.data.text ?? "";
}

export class TesseractOcrProvider implements OcrProvider {
  async extractLicence(image: Buffer | Uint8Array): Promise<LicenceOcrResult> {
    const prepared = await preprocessOcrImage(image);
    let rawText = await recognize(prepared, PSM.AUTO);
    let fields = parseAuLicence(rawText);

    const sparseText = await recognize(prepared, PSM.SPARSE_TEXT);
    const sparseFields = parseAuLicence(sparseText);
    fields = mergeLicenceFields(fields, sparseFields);
    if (sparseText && sparseText !== rawText) rawText = `${rawText}\n${sparseText}`.trim();

    if (!fields.licenceNumber) {
      for (const degrees of [90, 270, 180] as const) {
        const rotated = await rotateJpeg(prepared, degrees);
        const rotatedText = await recognize(rotated, PSM.AUTO);
        const rotatedFields = parseAuLicence(rotatedText);
        if (filledLicenceFields(rotatedFields).length > filledLicenceFields(fields).length) {
          fields = mergeLicenceFields(rotatedFields, fields);
          rawText = `${rawText}\n${rotatedText}`.trim();
        }
        if (fields.licenceNumber && filledLicenceFields(fields).length >= 2) break;
      }
    }

    return {
      rawText,
      ...fields,
      filledFields: filledLicenceFields(fields),
    };
  }
}

export function createOcrProvider(): OcrProvider {
  return new TesseractOcrProvider();
}
