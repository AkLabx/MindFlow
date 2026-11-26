export interface ExamDateShiftSortKey {
  raw: string;
  timestampMs: number | null;
  editionNumber: number | null;
  shiftNumber: number | null;
  timeMinutes: number | null;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const DMY_TEXT_MONTH_REGEX =
  /\b(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i;

const DMY_NUMERIC_REGEX = /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/;

const ISO_DATE_REGEX = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;

const MONTH_YEAR_REGEX =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i;

const BARE_YEAR_REGEX = /\b(19\d{2}|20\d{2})\b/;

const EDITION_REGEX = /\b(\d+)(?:st|nd|rd|th)\b/i;

const SHIFT_REGEX = /\bShift\s*[-:#]?\s*(\d+)\b/i;

const TIME_REGEX = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i;

const toValidUtcTimestamp = (year: number, monthIndex: number, day: number): number | null => {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const ms = Date.UTC(year, monthIndex, day);
  return Number.isFinite(ms) ? ms : null;
};

const extractTimestampMs = (raw: string): number | null => {
  const dmyText = DMY_TEXT_MONTH_REGEX.exec(raw);
  if (dmyText) {
    const startDay = Number(dmyText[1]);
    const endDay = dmyText[2] ? Number(dmyText[2]) : startDay;
    const monthIndex = MONTH_INDEX[dmyText[3].toLowerCase()];
    const year = Number(dmyText[4]);
    return toValidUtcTimestamp(year, monthIndex, Math.max(startDay, endDay));
  }

  const isoMatch = ISO_DATE_REGEX.exec(raw);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return toValidUtcTimestamp(year, monthIndex, day);
  }

  const dmyNum = DMY_NUMERIC_REGEX.exec(raw);
  if (dmyNum) {
    const day = Number(dmyNum[1]);
    const monthIndex = Number(dmyNum[2]) - 1;
    const year = Number(dmyNum[3]);
    return toValidUtcTimestamp(year, monthIndex, day);
  }

  const monthYear = MONTH_YEAR_REGEX.exec(raw);
  if (monthYear) {
    const monthIndex = MONTH_INDEX[monthYear[1].toLowerCase()];
    const year = Number(monthYear[2]);
    return toValidUtcTimestamp(year, monthIndex, 1);
  }

  const bareYear = BARE_YEAR_REGEX.exec(raw);
  if (bareYear) {
    return toValidUtcTimestamp(Number(bareYear[1]), 0, 1);
  }

  return null;
};

const extractTimeMinutes = (raw: string): number | null => {
  const match = TIME_REGEX.exec(raw);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return null;
  }
  let hour24 = hour % 12;
  if (meridiem === 'PM') hour24 += 12;
  return hour24 * 60 + minute;
};

/**
 * Parses all canonical MindFlow `examDateShift` strings into a structured sort key
 * covering full dates, date ranges (`01–04 Mar 2024`), numeric dates (`30-09-2023`),
 * month-year labels (`Jul 2024`), exam editions (`71st > 70th > 69th`), shift numbers,
 * and shift times.
 */
export const parseExamDateShiftSortKey = (raw: string): ExamDateShiftSortKey => {
  const text = String(raw ?? '').trim();
  const editionMatch = EDITION_REGEX.exec(text);
  const shiftMatch = SHIFT_REGEX.exec(text);

  return {
    raw: text,
    timestampMs: extractTimestampMs(text),
    editionNumber: editionMatch ? Number(editionMatch[1]) : null,
    shiftNumber: shiftMatch ? Number(shiftMatch[1]) : null,
    timeMinutes: extractTimeMinutes(text),
  };
};

/**
 * Compares two `examDateShift` labels latest-to-oldest:
 * 1. Date descending (if both have dates) or Edition descending (when comparing editions like `71st` vs `69th`)
 * 2. Edition descending (`71st > 70th > 69th`)
 * 3. Shift number descending (`Shift 4 > Shift 3 > Shift 2 > Shift 1`)
 * 4. Shift time descending (`05:00 PM > 01:30 PM > 09:00 AM`)
 * 5. Alphabetical fallback only when neither string yields parseable temporal/edition tokens.
 */
export const compareExamDateShiftsDesc = (a: string, b: string): number => {
  const ka = parseExamDateShiftSortKey(a);
  const kb = parseExamDateShiftSortKey(b);

  if (ka.timestampMs !== null && kb.timestampMs !== null) {
    if (kb.timestampMs !== ka.timestampMs) {
      return kb.timestampMs - ka.timestampMs;
    }
  } else if (ka.editionNumber !== null && kb.editionNumber !== null) {
    if (kb.editionNumber !== ka.editionNumber) {
      return kb.editionNumber - ka.editionNumber;
    }
  } else if (ka.timestampMs !== null || kb.timestampMs !== null) {
    return ka.timestampMs !== null ? -1 : 1;
  } else if (ka.editionNumber !== null || kb.editionNumber !== null) {
    return ka.editionNumber !== null ? -1 : 1;
  }

  if (ka.editionNumber !== null && kb.editionNumber !== null && kb.editionNumber !== ka.editionNumber) {
    return kb.editionNumber - ka.editionNumber;
  }

  if (ka.shiftNumber !== null && kb.shiftNumber !== null && kb.shiftNumber !== ka.shiftNumber) {
    return kb.shiftNumber - ka.shiftNumber;
  }
  if (ka.shiftNumber !== null && kb.shiftNumber === null) return -1;
  if (ka.shiftNumber === null && kb.shiftNumber !== null) return 1;

  if (ka.timeMinutes !== null && kb.timeMinutes !== null && kb.timeMinutes !== ka.timeMinutes) {
    return kb.timeMinutes - ka.timeMinutes;
  }

  return ka.raw.localeCompare(kb.raw, undefined, { numeric: true, sensitivity: 'base' });
};
