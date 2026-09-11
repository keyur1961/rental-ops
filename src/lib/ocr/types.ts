export type LicenceFields = {
  name?: string;
  licenceNumber?: string;
  expiry?: string;
  address?: string;
  dob?: string;
  licenceClass?: string;
};

export type LicenceOcrResult = LicenceFields & {
  rawText: string;
  filledFields: Array<keyof LicenceFields>;
};

export interface OcrProvider {
  extractLicence(image: Buffer | Uint8Array): Promise<LicenceOcrResult>;
}
