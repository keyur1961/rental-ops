import { createWorker, PSM, type Worker } from "tesseract.js";
import { parseAuLicence } from "@/lib/ocr/parse-au-licence";
import type { LicenceOcrResult, OcrProvider } from "@/lib/ocr/types";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      return worker;
    })();
  }
  return workerPromise;
}

export class TesseractOcrProvider implements OcrProvider {
  async extractLicence(image: Buffer | Uint8Array): Promise<LicenceOcrResult> {
    const worker = await getWorker();
    const result = await worker.recognize(Buffer.from(image));
    const rawText = result.data.text ?? "";
    return {
      rawText,
      ...parseAuLicence(rawText),
    };
  }
}

export function createOcrProvider(): OcrProvider {
  return new TesseractOcrProvider();
}
