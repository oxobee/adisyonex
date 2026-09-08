/**
 * Phone number normalization and formatting utilities.
 * Handles Turkish mobile and landline numbers (+90, 0, 0090, raw).
 */

/**
 * Normalizes any valid Turkish phone input into international format: +905XXXXXXXXX or +90XXXXXXXXXX.
 * Handles prefixes: +90, 0090, 0, or bare 10 digits.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";

  // Strip all whitespace, dashes, parentheses, dots
  let cleaned = raw.trim().replace(/[^\d+]/g, "");

  // Handle leading "+" or "00"
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  if (cleaned.startsWith("+90")) {
    const digits = cleaned.slice(3);
    if (digits.length === 10) {
      return `+90${digits}`;
    }
    return cleaned;
  }

  // Pure digits without leading +
  const digitsOnly = cleaned.replace(/\D/g, "");

  // 12 digits: e.g. 905321234567
  if (digitsOnly.length === 12 && digitsOnly.startsWith("90")) {
    return `+${digitsOnly}`;
  }

  // 11 digits: e.g. 05321234567 or 02123456789
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `+90${digitsOnly.slice(1)}`;
  }

  // 10 digits: e.g. 5321234567 or 2123456789
  if (digitsOnly.length === 10) {
    return `+90${digitsOnly}`;
  }

  // Fallback for foreign or unusual lengths
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  return digitsOnly ? `+${digitsOnly}` : "";
}

/**
 * Returns an array of search variations for a normalized or raw phone number
 * to support legacy unnormalized records in the database.
 */
export function getPhoneSearchVariations(rawPhone: string): string[] {
  const norm = normalizePhoneNumber(rawPhone);
  const digitsOnly = (norm || rawPhone).replace(/\D/g, "");

  const variations = new Set<string>();
  if (rawPhone) variations.add(rawPhone.trim());
  if (norm) variations.add(norm);

  if (digitsOnly.length === 12 && digitsOnly.startsWith("90")) {
    const tenDigits = digitsOnly.slice(2);
    variations.add(tenDigits);
    variations.add(`0${tenDigits}`);
    variations.add(`+90${tenDigits}`);
    variations.add(`90${tenDigits}`);
    variations.add(`0090${tenDigits}`);
  } else if (digitsOnly.length === 10) {
    variations.add(digitsOnly);
    variations.add(`0${digitsOnly}`);
    variations.add(`+90${digitsOnly}`);
    variations.add(`90${digitsOnly}`);
    variations.add(`0090${digitsOnly}`);
  }

  return Array.from(variations);
}

/**
 * Formats a phone number for user-friendly display in UI:
 * e.g. 0 (532) 123 45 67
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return "";
  const norm = normalizePhoneNumber(phone);
  const digitsOnly = norm.replace(/\D/g, "");

  if (digitsOnly.length === 12 && digitsOnly.startsWith("90")) {
    const d = digitsOnly.slice(2);
    // 0 (XXX) XXX XX XX
    return `0 (${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  }

  if (digitsOnly.length === 10) {
    return `0 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 8)} ${digitsOnly.slice(8, 10)}`;
  }

  return phone;
}
