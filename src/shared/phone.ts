/**
 * Phone normalisation to E.164 (+<country><national>).
 *
 * Accepted inputs:
 *  - WhatsApp wa_id: international digits without "+" ("34612345678")
 *  - "+34 612 34 56 78", "+34-612-345-678", "(+34) 612345678"
 *  - "0034612345678" (international "00" prefix)
 *  - National numbers ("612345678") ONLY when a default country calling code is
 *    supplied and the number is not already international.
 *
 * Deliberately conservative: anything ambiguous returns null instead of guessing,
 * because a wrong guess would attach messages/appointments to the wrong customer.
 */

const E164 = /^\+[1-9]\d{6,14}$/;

/** National significant number lengths for countries we expect to serve. */
const NATIONAL_LENGTHS: Record<string, number[]> = {
  '34': [9], // Spain
  '351': [9], // Portugal
  '33': [9], // France
  '39': [9, 10], // Italy (mobile 10, many landlines 9-10)
  '49': [10, 11], // Germany (mobile)
  '44': [10], // UK
  '1': [10], // NANP
  '52': [10], // Mexico
  '54': [10], // Argentina
  '57': [10], // Colombia
};

export function isE164(value: string): boolean {
  return E164.test(value);
}

export interface NormalizeOptions {
  /** Country calling code without "+", e.g. "34". Used for national-format input. */
  defaultCountryCode?: string;
  /**
   * When true the input is known to be in international format without "+"
   * (WhatsApp wa_id). Never interpreted as a national number.
   */
  assumeInternational?: boolean;
}

export function normalizePhone(raw: string, options: NormalizeOptions = {}): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 32) return null;
  // Only digits, spaces and common separators are acceptable.
  if (!/^[+\d\s().\-/]+$/.test(trimmed)) return null;

  const hasPlus = trimmed.startsWith('+') || trimmed.startsWith('(+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return null;

  let candidate: string;
  if (hasPlus) {
    candidate = `+${digits}`;
  } else if (digits.startsWith('00')) {
    candidate = `+${digits.slice(2)}`;
  } else if (options.assumeInternational) {
    candidate = `+${digits}`;
  } else if (options.defaultCountryCode) {
    const cc = options.defaultCountryCode;
    const nationalLengths = NATIONAL_LENGTHS[cc];
    if (nationalLengths?.includes(digits.length)) {
      candidate = `+${cc}${digits}`;
    } else if (digits.startsWith(cc) && nationalLengths?.includes(digits.length - cc.length)) {
      // Already includes the country code but without "+"/"00" (e.g. "34612345678").
      candidate = `+${digits}`;
    } else {
      return null;
    }
  } else {
    return null;
  }

  return isE164(candidate) ? candidate : null;
}

/** Masks a phone for logs: +34******678 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(none)';
  if (phone.length <= 6) return '***';
  return `${phone.slice(0, 3)}${'*'.repeat(Math.max(phone.length - 6, 3))}${phone.slice(-3)}`;
}

/** WhatsApp Cloud API expects the recipient without "+". */
export function toWhatsAppRecipient(e164: string): string {
  return e164.replace(/^\+/, '');
}
