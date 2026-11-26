export type ShiftSlot = 'morning' | 'afternoon' | 'evening';

export interface ShiftBadgeInfo {
  slot: ShiftSlot;
  slotLabel: 'Morning' | 'Afternoon' | 'Evening';
  shiftLabel?: string;
  timing?: string;
  compactText: string;
}

const SLOT_LABELS: Record<ShiftSlot, 'Morning' | 'Afternoon' | 'Evening'> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const TIME_RANGE_REGEX =
  /\b(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM))?)\b/i;

const SINGLE_TIME_REGEX = /\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i;

const SHIFT_NUMBER_REGEX = /\bShift\s*[-:#]?\s*(\d+)\b/i;

export const normalizeShiftSlot = (raw: unknown): ShiftSlot | null => {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === 'morning' || cleaned === 'afternoon' || cleaned === 'evening') {
    return cleaned;
  }
  return null;
};

const normalizeTimingString = (raw: string | null | undefined): string | undefined => {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed
    .replace(/\s*[-–]\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
};

const inferSlotFromTiming = (timing: string): ShiftSlot | null => {
  const match = SINGLE_TIME_REGEX.exec(timing);
  if (!match) return null;
  const rawHour = Number(match[1]);
  const meridiem = match[3].toUpperCase();
  if (!Number.isFinite(rawHour) || rawHour < 1 || rawHour > 12) return null;

  let hour24 = rawHour % 12;
  if (meridiem === 'PM') {
    hour24 += 12;
  }

  if (hour24 < 12) return 'morning';
  if (hour24 < 16) return 'afternoon';
  return 'evening';
};

const inferSlotFromShiftNumber = (shiftNum: number): ShiftSlot | null => {
  if (!Number.isFinite(shiftNum) || shiftNum <= 0) return null;
  if (shiftNum === 1) return 'morning';
  if (shiftNum === 2) return 'afternoon';
  return 'evening';
};

/**
 * Extracts normalized exam shift slot (`Morning` / `Afternoon` / `Evening`), shift label,
 * and timing string from structured `shift_slot`/`shift_timing` columns or falls back to
 * regex parsing `name`/`description`.
 */
export const extractShiftBadgeInfo = (
  test:
    | {
        shift_slot?: string | null;
        shift_timing?: string | null;
        name?: string | null;
        description?: string | null;
      }
    | null
    | undefined
): ShiftBadgeInfo | null => {
  if (!test || typeof test !== 'object') return null;

  const haystack = [test.name, test.description]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ');

  const shiftMatch = SHIFT_NUMBER_REGEX.exec(haystack);
  const shiftNumber = shiftMatch ? Number(shiftMatch[1]) : null;
  const shiftLabel = shiftNumber && Number.isFinite(shiftNumber) ? `Shift ${shiftNumber}` : undefined;

  const explicitTiming = normalizeTimingString(test.shift_timing);
  const regexTimingMatch = !explicitTiming ? TIME_RANGE_REGEX.exec(haystack) : null;
  const timing = explicitTiming ?? normalizeTimingString(regexTimingMatch?.[1]);

  let slot = normalizeShiftSlot(test.shift_slot);
  if (!slot && shiftNumber !== null) {
    slot = inferSlotFromShiftNumber(shiftNumber);
  }
  if (!slot && timing) {
    slot = inferSlotFromTiming(timing);
  }
  if (!slot && haystack) {
    if (/\bmorning\b/i.test(haystack)) slot = 'morning';
    else if (/\bafternoon\b/i.test(haystack)) slot = 'afternoon';
    else if (/\bevening\b/i.test(haystack)) slot = 'evening';
  }

  if (!slot) return null;

  const slotLabel = SLOT_LABELS[slot];
  const parts: string[] = [slotLabel];
  if (shiftLabel) {
    parts.push(shiftLabel);
  }
  let compactText = parts.join(' • ');
  if (timing) {
    compactText = `${compactText} (${timing})`;
  }

  return {
    slot,
    slotLabel,
    ...(shiftLabel ? { shiftLabel } : {}),
    ...(timing ? { timing } : {}),
    compactText,
  };
};
