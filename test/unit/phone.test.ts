import { describe, expect, it } from 'vitest';
import { maskPhone, normalizePhone, toWhatsAppRecipient } from '../../src/shared/phone.js';

describe('normalizePhone (E.164)', () => {
  it('maps every common Spanish format of the same number to one canonical value', () => {
    const variants = ['+34612345678', '+34 612 34 56 78', '0034612345678', '612345678', '612 345 678', '(+34) 612-345-678', '34612345678'];
    const normalized = variants.map((v) => normalizePhone(v, { defaultCountryCode: '34' }));
    expect(new Set(normalized)).toEqual(new Set(['+34612345678']));
  });

  it('treats WhatsApp wa_id as international (never as a national number)', () => {
    expect(normalizePhone('34612345678', { assumeInternational: true })).toBe('+34612345678');
    expect(normalizePhone('447700900123', { assumeInternational: true })).toBe('+447700900123');
    expect(normalizePhone('5215512345678', { assumeInternational: true })).toBe('+5215512345678');
  });

  it('refuses ambiguous or invalid input instead of guessing', () => {
    expect(normalizePhone('612345678')).toBeNull(); // national without default country
    expect(normalizePhone('12345', { defaultCountryCode: '34' })).toBeNull();
    expect(normalizePhone('+0034612345678')).toBeNull();
    expect(normalizePhone('call me 612345678', { defaultCountryCode: '34' })).toBeNull();
    expect(normalizePhone('', { defaultCountryCode: '34' })).toBeNull();
    expect(normalizePhone('+1234567890123456789')).toBeNull(); // > 15 digits
  });

  it('masks phones for logs and formats WhatsApp recipients', () => {
    expect(maskPhone('+34612345678')).toBe('+34******678');
    expect(maskPhone(null)).toBe('(none)');
    expect(toWhatsAppRecipient('+34612345678')).toBe('34612345678');
  });
});
