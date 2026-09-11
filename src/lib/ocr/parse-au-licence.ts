import type { LicenceFields } from "./types";

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const SKIP_NAME_WORDS =
  /licence|license|queensland|new south wales|victoria|australia|driver|card|photo|expires?|expiry|class|address|born|dob|government|conditions?|effective|type|crn|safely/i;

const AU_CLASSES = ["MC", "HC", "HR", "MR", "LR", "RE", "C", "R"];

const DATE_NUMERIC =
  /(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{2,4})/g;
const DATE_MONTH_NAME = /(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{2,4})/gi;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function uniqueLines(text: string): string[] {
  return text.split(/\r?\n/).map(cleanLine).filter(Boolean);
}

function matchFirst(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
}

function expandYear(year: string, kind: "dob" | "expiry" | "any"): string {
  if (year.length === 4) return year;
  const two = Number(year);
  if (kind === "dob") {
    const currentTwo = new Date().getFullYear() % 100;
    return two > currentTwo + 1 ? `19${year.padStart(2, "0")}` : `20${year.padStart(2, "0")}`;
  }
  return `20${year.padStart(2, "0")}`;
}

function normaliseDate(value: string, kind: "dob" | "expiry" | "any" = "any"): string {
  const trimmed = value.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const monthName = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{2,4})$/);
  if (monthName) {
    const month = MONTHS[monthName[2].toLowerCase()];
    if (month) {
      return `${monthName[1].padStart(2, "0")}/${month}/${expandYear(monthName[3], kind)}`;
    }
  }
  const numeric = trimmed
    .replace(/[.]/g, "/")
    .replace(/-/g, "/")
    .replace(/\s+/g, "/")
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (numeric) {
    return `${numeric[1].padStart(2, "0")}/${numeric[2].padStart(2, "0")}/${expandYear(numeric[3], kind)}`;
  }
  return trimmed;
}

function asDate(value: string, kind: "dob" | "expiry" | "any"): string | undefined {
  const normalised = normaliseDate(value, kind);
  return /^\d{2}\/\d{2}\/\d{4}$/.test(normalised) ? normalised : undefined;
}

function findDates(text: string, kind: "dob" | "expiry" | "any"): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(DATE_MONTH_NAME)) {
    const date = asDate(match[0], kind === "any" ? "dob" : kind);
    if (date) found.push(date);
  }
  for (const match of text.matchAll(DATE_NUMERIC)) {
    const date = asDate(match[0], kind);
    if (date) found.push(date);
  }
  return [...new Set(found)];
}

function compactLicenceCandidate(value: string): string | undefined {
  const nsw = value.match(/\b([A-Z]{1,3}\d{5,10})\b/i);
  if (nsw) return nsw[1].toUpperCase();
  const grouped = value.match(/\b(\d{3}[\s-]\d{3}[\s-]\d{3})\b/);
  if (grouped) return grouped[1].replace(/[\s-]/g, "");
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length >= 8 && digits.length <= 10) return digits;
  const run = value.match(/\b(\d{8,10})\b/);
  return run?.[1];
}

function extractLicenceNumber(text: string, lines: string[]): string | undefined {
  const labelled = matchFirst(text, [
    /licen[cs]e\s*(?:no|number|#)(?:\s*[./]?\s*crn)?\s*[:.]?\s*([A-Z0-9][A-Z0-9\s-]{4,18})/i,
    /(?:\bno|\bnumber|#)\s*[:.]?\s*([A-Z0-9]{5,12})/i,
  ]);
  const fromLabel = labelled ? compactLicenceCandidate(labelled) : undefined;
  if (fromLabel) return fromLabel;

  for (let index = 0; index < lines.length; index += 1) {
    if (!/licen[cs]e\s*(?:no|number|#)|\bcrn\b/i.test(lines[index])) continue;
    const sameLine = compactLicenceCandidate(lines[index].replace(/licen[cs]e\s*(?:no|number|#)?(?:\s*[./]?\s*crn)?/i, ""));
    if (sameLine) return sameLine;
    for (const next of lines.slice(index + 1, index + 3)) {
      const candidate = compactLicenceCandidate(next);
      if (candidate) return candidate;
    }
  }

  const grouped = text.match(/\b(\d{3}[\s-]\d{3}[\s-]\d{3})\b/);
  if (grouped) return grouped[1].replace(/[\s-]/g, "");

  return matchFirst(text, [/\b([A-Z]{1,3}\d{5,10})\b/, /\b([0-9]{8,10})\b/]);
}

function extractExpiry(text: string, lines: string[], dob?: string): string | undefined {
  const labelled = matchFirst(text, [
    /(?:expir(?:y|es)|\bexp\b)\s*[:.]?\s*(\d{1,2}[./\s-]\d{1,2}[./\s-]\d{2,4})/i,
    /(?:expir(?:y|es)|\bexp\b)\s*[:.]?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i,
  ]);
  if (labelled) return asDate(labelled, "expiry");

  const header = lines.findIndex((line) => /effective/i.test(line) || /expir|exp\b/i.test(line));
  const window = header >= 0 ? lines.slice(header, header + 3).join(" ") : text;
  const dates = findDates(window, "expiry").filter((date) => date !== dob);
  if (dates.length >= 2) return dates[dates.length - 1];
  if (dates.length === 1 && /expir|\bexp\b/i.test(window) && !/effective/i.test(window)) {
    return dates[0];
  }

  const all = findDates(text, "expiry").filter((date) => date !== dob);
  if (all.length >= 2) {
    return [...all].sort((a, b) => toSortable(b).localeCompare(toSortable(a)))[0];
  }
  if (all.length === 1 && /expir|\bexp\b/i.test(text)) return all[0];
  return undefined;
}

function toSortable(auDate: string): string {
  const match = auDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : auDate;
}

function extractDob(text: string): string | undefined {
  const labelled = matchFirst(text, [
    /(?:date of birth|d\.?o\.?b\.?|born)\s*[:.]?\s*(\d{1,2}[./\s-]\d{1,2}[./\s-]\d{2,4})/i,
    /(?:date of birth|d\.?o\.?b\.?|born)\s*[:.]?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i,
  ]);
  if (labelled) return asDate(labelled, "dob");
  const monthName = text.match(/\b(?:date of birth|d\.?o\.?b\.?|born)\s*[:.]?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i);
  return monthName ? normaliseDate(monthName[1], "dob") : undefined;
}

function isKnownClass(value: string): boolean {
  return AU_CLASSES.includes(value.toUpperCase());
}

function extractClass(text: string, lines: string[]): string | undefined {
  const labelled = matchFirst(text, [
    /(?:licence class|license class|class)\s*[:.]?\s*([A-Z]{1,3}(?:[ \t]+[A-Z]{1,3}){0,3})/i,
  ]);
  if (labelled) {
    const tokens = labelled.split(/\s+/).filter((token) => isKnownClass(token));
    if (tokens[0]) return tokens.join(" ");
  }

  const header = lines.findIndex((line) => /\bclass\b/i.test(line) && /\b(type|effective|expir)/i.test(line));
  if (header >= 0) {
    for (const line of lines.slice(header + 1, header + 3)) {
      const token = line.split(/\s+/).find((part) => isKnownClass(part.replace(/[^A-Za-z]/g, "")));
      if (token) return token.replace(/[^A-Za-z]/g, "").toUpperCase();
    }
  }

  const standalone = text.match(/\bclass\s+([A-Z]{1,3})\b/i);
  if (standalone && isKnownClass(standalone[1])) return standalone[1].toUpperCase();
  return undefined;
}

function isNameLine(line: string): boolean {
  if (SKIP_NAME_WORDS.test(line)) return false;
  if (/\d/.test(line)) return false;
  if (!/^[A-Z][A-Za-z' -]+$/.test(line)) return false;
  const words = line.split(/\s+/);
  return words.length >= 1 && words.length <= 4;
}

function extractName(text: string, lines: string[]): string | undefined {
  const labelled = matchFirst(text, [
    /\b(?:name|card holder)\s*[:.]?\s*([A-Z][A-Za-z' -]+,\s*[A-Z][A-Za-z' -]+)/i,
    /\b(?:name|card holder)\s*[:.]?\s*([A-Z][A-Za-z' -]+(?:\s+[A-Z][A-Za-z' -]+){1,3})/i,
  ]);
  if (labelled) return labelled.replace(/\s+/g, " ").trim();

  for (let index = 0; index < lines.length - 1; index += 1) {
    const current = lines[index].replace(/\s*\|\s*$/, "").trim();
    const next = lines[index + 1].replace(/\s*\|\s*$/, "").trim();
    const currentName = current.replace(/\s+\d{3}[\s-]\d{3}[\s-]\d{3}\b.*/, "").trim();
    if (isNameLine(currentName) && isNameLine(next)) {
      return `${currentName} ${next}`.replace(/\s+/g, " ").trim();
    }
  }

  return lines.find((line) => {
    const cleaned = line.replace(/\s*\|\s*$/, "").trim();
    if (!isNameLine(cleaned)) return false;
    return cleaned.split(/\s+/).length >= 2 && cleaned === cleaned.toUpperCase();
  });
}

const STREET_WORD =
  /\b(?:unit|lot|street|st|road|rd|ave|avenue|drive|dr|court|ct|place|pl|way|close|cl|crescent|cres|terrace|tce|parade|pde|highway|hwy|lane|ln)\b/i;

function extractAddress(text: string, lines: string[]): string | undefined {
  const labelled = matchFirst(text, [/(?:^|\n)\s*address\s*[:.]?\s+(\S[^\n]*(?:\n[^\n]+){0,2})/i]);
  if (labelled) return labelled.replace(/\s+/g, " ").trim();

  const skip =
    /update your|tmr\.qld|gov\.au|drive safely|card number|queensland|government|licen[cs]e|crn|\bclass\b|effective|expir|\bdob\b|conditions?|date of birth/i;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/\b[2-8]\d{3}\b/.test(line) || skip.test(line)) continue;
    const start = Math.max(0, index - 2);
    const block = lines.slice(start, index + 1).filter((part) => !skip.test(part));
    const joined = block.join(", ").replace(/\s+/g, " ").trim();
    const suburbPostcode = /^[A-Za-z][A-Za-z' -]+\s+[2-8]\d{3}\b/.test(line);
    if (STREET_WORD.test(joined) || suburbPostcode) return joined;
  }

  const stateLine = lines.find(
    (line) => /\b(?:QLD|NSW|VIC|SA|WA|TAS|NT|ACT)\b/.test(line) && !skip.test(line),
  );
  return stateLine;
}

export function parseAuLicence(rawText: string): LicenceFields {
  const text = rawText.replace(/\u0000/g, " ");
  const lines = uniqueLines(text);

  const licenceNumber = extractLicenceNumber(text, lines);
  const dob = extractDob(text);
  const expiry = extractExpiry(text, lines, dob);
  const licenceClass = extractClass(text, lines);
  const address = extractAddress(text, lines);
  const name = extractName(text, lines);

  return {
    name: name?.replace(/\s+/g, " ").trim(),
    licenceNumber,
    expiry: expiry ? normaliseDate(expiry, "expiry") : undefined,
    address: address?.replace(/\s+/g, " ").trim(),
    dob: dob ? normaliseDate(dob, "dob") : undefined,
    licenceClass: licenceClass?.split(/\r?\n/)[0]?.trim().toUpperCase(),
  };
}
