import type { LicenceFields } from "./types";

export const LICENCE_FIELD_KEYS = [
  "name",
  "licenceNumber",
  "expiry",
  "dob",
  "licenceClass",
  "address",
] as const;

export type LicenceFieldKey = (typeof LICENCE_FIELD_KEYS)[number];

export const LICENCE_FIELD_LABELS: Record<LicenceFieldKey, string> = {
  name: "name",
  licenceNumber: "licence number",
  expiry: "expiry",
  dob: "date of birth",
  licenceClass: "class",
  address: "address",
};

export function filledLicenceFields(fields: LicenceFields): LicenceFieldKey[] {
  return LICENCE_FIELD_KEYS.filter((key) => Boolean(fields[key]?.trim()));
}

export function mergeLicenceFields(base: LicenceFields, extra: LicenceFields): LicenceFields {
  return {
    name: base.name || extra.name,
    licenceNumber: base.licenceNumber || extra.licenceNumber,
    expiry: base.expiry || extra.expiry,
    address: base.address || extra.address,
    dob: base.dob || extra.dob,
    licenceClass: base.licenceClass || extra.licenceClass,
  };
}
