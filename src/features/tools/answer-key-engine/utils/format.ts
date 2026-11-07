/**
 * MindFlow Result Dashboard Pure Formatting Core
 * 
 * Provides en-IN digit grouping, trailing zero suppression for marks,
 * 12-hour IST date/time parsing, directional deltas, and PII masking.
 */

/**
 * Formats a number with Indian digit grouping (e.g. 2,84,571).
 */
export function formatIndianNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);

  return num.toLocaleString('en-IN');
}

/**
 * Formats score/marks with trailing zero suppression (e.g. 136, 40.5, 137.37).
 */
export function formatMarks(marks: number | null | undefined): string {
  if (marks === null || marks === undefined || Number.isNaN(marks)) {
    return '—';
  }

  // Format to up to 2 decimal places, trimming trailing zeros
  const rounded = Math.round((marks + Number.EPSILON) * 100) / 100;
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }

  const str = rounded.toFixed(2);
  return str.endsWith('0') ? str.slice(0, -1) : str;
}

/**
 * Formats percentile (e.g. "88.56%ile" or "88.56%").
 */
export function formatPercentile(percentile: number | null | undefined): string {
  if (percentile === null || percentile === undefined || Number.isNaN(percentile)) {
    return '—';
  }
  return `${percentile.toFixed(2)}%`;
}

/**
 * Formats Top X% (e.g. "Top 14.3%").
 */
export function formatTopPercentage(topPct: number | null | undefined): string {
  if (topPct === null || topPct === undefined || Number.isNaN(topPct)) {
    return '—';
  }
  return `Top ${topPct.toFixed(1)}%`;
}

/**
 * Formats exam date into human-readable string (e.g. "13 Oct 2026").
 */
export function formatExamDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';

  // Handle formats like "13/10/2026", "2026-10-13", "13-10-2026"
  const clean = dateStr.trim();
  const dateObj = new Date(clean);

  if (!Number.isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Fallback for DD/MM/YYYY or DD-MM-YYYY
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return clean;
}

/**
 * Formats exam time into 12-hour IST range (e.g. "9:00 AM - 10:00 AM IST").
 */
export function formatExamTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  const clean = timeStr.trim();

  // If already contains IST or AM/PM, preserve or clean
  if (/IST/i.test(clean)) {
    return clean;
  }

  return `${clean} IST`;
}

/**
 * Formats directional delta with trend text (e.g. "+30.94 more").
 */
export function formatDeltaText(delta: number): string {
  if (Math.abs(delta) < 0.005) {
    return 'Equal to average';
  }
  const formattedVal = Math.abs(delta).toFixed(2);
  if (delta > 0) {
    return `+${formattedVal} more`;
  }
  return `-${formattedVal} less`;
}

/**
 * Masks roll number preserving first 4 and last 2 characters (e.g. "3261******36").
 */
export function formatMaskedRoll(roll: string | null | undefined): string {
  if (!roll) return '—';
  const s = roll.trim();
  if (s.length <= 6) {
    return s.slice(0, 2) + '*'.repeat(Math.max(1, s.length - 3)) + s.slice(-1);
  }

  const prefix = s.slice(0, 4);
  const suffix = s.slice(-2);
  const maskLength = s.length - 6;
  return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
}

/**
 * Masks candidate name preserving first letter of each word (e.g. "R*** K***").
 */
export function formatMaskedName(name: string | null | undefined): string {
  if (!name) return '—';
  const words = name.trim().split(/\s+/);
  return words
    .map(w => {
      if (w.length <= 1) return w;
      return `${w[0]}***`;
    })
    .join(' ');
}

/**
 * Formats exam time and shift into unified display (e.g. "10:00 AM (Shift-1)").
 */
export function formatExamTimeWithShift(timeStr?: string | null, shiftStr?: string | null): string {
  if (!timeStr && !shiftStr) return '—';

  // If timeStr already formatted with shift (e.g. "10:00 AM (Shift-1)")
  if (timeStr && /shift/i.test(timeStr)) {
    return timeStr.trim();
  }

  let formattedTime = '10:00 AM';
  if (timeStr) {
    const rawTime = timeStr.split('-')[0].trim();
    // Normalize "10:00:00 AM" or "10:00 AM"
    const timeMatch = rawTime.match(/([0-9]{1,2}:[0-9]{2})(?::[0-9]{2})?\s*(AM|PM)?/i);
    if (timeMatch) {
      formattedTime = `${timeMatch[1]} ${timeMatch[2] ? timeMatch[2].toUpperCase() : 'AM'}`;
    } else {
      formattedTime = rawTime;
    }
  }

  let formattedShift = 'Shift-1';
  if (shiftStr) {
    const sMatch = shiftStr.match(/shift\s*[-_]?\s*([0-9]+|[A-Za-z]+)/i);
    if (sMatch) {
      formattedShift = `Shift-${sMatch[1]}`;
    } else if (shiftStr.trim()) {
      formattedShift = shiftStr.trim();
    }
  }

  return `${formattedTime} (${formattedShift})`;
}

/**
 * Complete official registry of Indian States & Union Territories.
 */
export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

/**
 * Robust heuristic to infer state from official examination venue names and center addresses.
 */
export function inferStateFromVenue(venue: string | null | undefined): string | null {
  if (!venue) return null;
  const upperVenue = venue.toUpperCase();

  for (const st of INDIAN_STATES) {
    if (upperVenue.includes(st.toUpperCase())) {
      return st;
    }
  }

  // Major educational / CBT test cities mapped to states
  if (upperVenue.includes('PATNA') || upperVenue.includes('GAYA') || upperVenue.includes('MUZAFFARPUR') || upperVenue.includes('BHAGALPUR') || upperVenue.includes('DARBHANGA') || upperVenue.includes('PURNEA')) return 'Bihar';
  if (upperVenue.includes('DELHI') || upperVenue.includes('NOIDA') || upperVenue.includes('GREATER NOIDA') || upperVenue.includes('GURGAON') || upperVenue.includes('GURUGRAM')) return 'Delhi';
  if (upperVenue.includes('LUCKNOW') || upperVenue.includes('KANPUR') || upperVenue.includes('VARANASI') || upperVenue.includes('PRAYAGRAJ') || upperVenue.includes('ALLAHABAD') || upperVenue.includes('AGRA') || upperVenue.includes('MEERUT') || upperVenue.includes('BAREILLY') || upperVenue.includes('GORAKHPUR')) return 'Uttar Pradesh';
  if (upperVenue.includes('JAIPUR') || upperVenue.includes('JODHPUR') || upperVenue.includes('KOTA') || upperVenue.includes('AJMER') || upperVenue.includes('BIKANER') || upperVenue.includes('UDAIPUR')) return 'Rajasthan';
  if (upperVenue.includes('KOLKATA') || upperVenue.includes('HOWRAH') || upperVenue.includes('SILIGURI') || upperVenue.includes('ASANSOL') || upperVenue.includes('DURGAPUR')) return 'West Bengal';
  if (upperVenue.includes('MUMBAI') || upperVenue.includes('PUNE') || upperVenue.includes('NAGPUR') || upperVenue.includes('THANE') || upperVenue.includes('NASHIK') || upperVenue.includes('AURANGABAD')) return 'Maharashtra';
  if (upperVenue.includes('BHOPAL') || upperVenue.includes('INDORE') || upperVenue.includes('GWALIOR') || upperVenue.includes('JABALPUR') || upperVenue.includes('UJJAIN')) return 'Madhya Pradesh';
  if (upperVenue.includes('RANCHI') || upperVenue.includes('DHANBAD') || upperVenue.includes('JAMSHEDPUR') || upperVenue.includes('BOKARO')) return 'Jharkhand';
  if (upperVenue.includes('CHANDIGARH') || upperVenue.includes('AMBALA') || upperVenue.includes('FARIDABAD') || upperVenue.includes('HISAR') || upperVenue.includes('PANIPAT')) return 'Haryana';
  if (upperVenue.includes('HYDERABAD') || upperVenue.includes('WARANGAL')) return 'Telangana';
  if (upperVenue.includes('BENGALURU') || upperVenue.includes('BANGALORE') || upperVenue.includes('MYSURU')) return 'Karnataka';
  if (upperVenue.includes('CHENNAI') || upperVenue.includes('COIMBATORE') || upperVenue.includes('MADURAI')) return 'Tamil Nadu';
  if (upperVenue.includes('AHMEDABAD') || upperVenue.includes('SURAT') || upperVenue.includes('VADODARA') || upperVenue.includes('RAJKOT')) return 'Gujarat';

  return null;
}
