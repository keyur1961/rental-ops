import type { LicenceFields } from "./types";

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function uniqueLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
}

function matchFirst(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
}

function normaliseDate(value: string): string {
  const trimmed = value.replace(/[.]/g, "/").replace(/-/g, "/").trim();
  const numeric = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (numeric) {
    const day = numeric[1].padStart(2, "0");
    const month = numeric[2].padStart(2, "0");
    const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
    return `${day}/${month}/${year}`;
  }
  return trimmed;
}

const SKIP_NAME_WORDS =
  /licence|license|queensland|new south wales|victoria|australia|driver|card|photo|expires|expiry|class|address|born|dob/i;

export function parseAuLicence(rawText: string): LicenceFields {
  const text = rawText.replace(/\u0000/g, " ");
  const lines = uniqueLines(text);

  const licenceNumber = matchFirst(text, [
    /licence\s*(?:no|number|#)\s*[:.]?\s*([A-Z0-9]{5,12})/i,
    /license\s*(?:no|number|#)\s*[:.]?\s*([A-Z0-9]{5,12})/i,
    /\b(?:no|number)\s*[:.]?\s*([0-9]{6,10})\b/i,
    /\b([0-9]{8})\b/,
  ]);

  const expiry = matchFirst(text, [
    /(?:expir(?:y|es)|exp)\s*[:.]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /(?:expir(?:y|es)|exp)\s*[:.]?\s*(\d{1,2}\s+\w+\s+\d{2,4})/i,
  ]);

  const dob = matchFirst(text, [
    /(?:date of birth|d\.?o\.?b\.?|born)\s*[:.]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /(?:date of birth|d\.?o\.?b\.?|born)\s*[:.]?\s*(\d{1,2}\s+\w+\s+\d{2,4})/i,
  ]);

  const licenceClass = matchFirst(text, [
    /(?:licence class|license class|class)\s*[:.]?\s*([A-Z]{1,3}(?:[ \t]+[A-Z]{1,3}){0,3})/i,
    /\bclass\s+([A-Z]{1,3})\b/i,
  ]);

  let address = matchFirst(text, [
    /address\s*[:.]?\s*([^\n]+(?:\n[^\n]+){0,2})/i,
  ]);

  if (!address) {
    const qldLine = lines.find((line) => /\bQLD\b|\bNSW\b|\bVIC\b|\b4101\b|\b4000\b/i.test(line));
    if (qldLine) address = qldLine;
  }

  let name = matchFirst(text, [
    /\b(?:name|card holder)\s*[:.]?\s*([A-Z][A-Za-z' -]+,\s*[A-Z][A-Za-z' -]+)/i,
    /\b(?:name|card holder)\s*[:.]?\s*([A-Z][A-Za-z' -]+(?:\s+[A-Z][A-Za-z' -]+){1,3})/i,
  ]);

  if (!name) {
    name = lines.find((line) => {
      if (SKIP_NAME_WORDS.test(line)) return false;
      if (/\d/.test(line)) return false;
      const words = line.split(" ");
      return words.length >= 2 && words.length <= 4 && line === line.toUpperCase();
    });
  }

  return {
    name: name?.replace(/\s+/g, " ").trim(),
    licenceNumber,
    expiry: expiry ? normaliseDate(expiry) : undefined,
    address: address?.replace(/\s+/g, " ").trim(),
    dob: dob ? normaliseDate(dob) : undefined,
    licenceClass: licenceClass?.split(/\r?\n/)[0]?.trim().toUpperCase(),
  };
}
