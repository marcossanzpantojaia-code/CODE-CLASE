import { DateTime } from 'luxon';
import { diffLocalDays, localDateOf } from '../shared/time.js';

/** Spanish formatting helpers. All values come from the database. */

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toLocaleUpperCase('es') + s.slice(1);
}

/** "Miércoles 14 de octubre" */
export function formatLongDate(localDate: string): string {
  const d = DateTime.fromISO(localDate, { zone: 'UTC' }).setLocale('es');
  return capitalize(d.toFormat("cccc d 'de' LLLL"));
}

/** "miércoles 14 de octubre" (for use inside a sentence) */
export function formatLongDateInline(localDate: string): string {
  return DateTime.fromISO(localDate, { zone: 'UTC' }).setLocale('es').toFormat("cccc d 'de' LLLL");
}

/** "miércoles 14" */
export function formatShortDate(localDate: string): string {
  return DateTime.fromISO(localDate, { zone: 'UTC' }).setLocale('es').toFormat('cccc d');
}

/** "hoy" / "mañana" / "pasado mañana" / "el jueves 15" relative to today (local dates). */
export function relativeDayLabel(localDate: string, today: string): string {
  const diff = diffLocalDays(today, localDate);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  if (diff === 2) return 'pasado mañana';
  return `el ${formatShortDate(localDate)}`;
}

/** "18:30" in the business timezone. */
export function formatTime(instant: Date, tz: string): string {
  return DateTime.fromJSDate(instant, { zone: tz }).toFormat('HH:mm');
}

export function localDateLabel(instant: Date, tz: string, today: string): string {
  return relativeDayLabel(localDateOf(instant, tz), today);
}

const CLOCKS_FULL = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
const CLOCKS_HALF = ['🕧', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦'];

/** Clock emoji closest to the time: 18:30 -> 🕡 */
export function clockEmoji(instant: Date, tz: string): string {
  const d = DateTime.fromJSDate(instant, { zone: tz });
  const h = d.hour % 12;
  return d.minute >= 15 && d.minute < 45 ? (CLOCKS_HALF[h] as string) : (CLOCKS_FULL[(d.minute >= 45 ? h + 1 : h) % 12] as string);
}

const KEYCAPS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
export function numberEmoji(n: number): string {
  return KEYCAPS[n - 1] ?? `${n}.`;
}

/** 2500 -> "25 €", 1250 -> "12,50 €" */
export function formatPrice(cents: number, currency: string): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export interface PricedService {
  name: string;
  priceType: 'FIXED' | 'FROM' | 'ON_REQUEST';
  priceCents: number | null;
}

/** "25 €", "desde 40 €", "precio a consultar" */
export function formatServicePrice(s: PricedService, currency: string): string {
  if (s.priceType === 'ON_REQUEST' || s.priceCents === null) return 'precio a consultar';
  const p = formatPrice(s.priceCents, currency);
  return s.priceType === 'FROM' ? `desde ${p}` : p;
}

/** Joins service names: "Corte + barba", "Corte caballero + Barba". */
export function servicesLabel(names: readonly string[]): string {
  return names.join(' + ');
}

/** Lower-cases the first letter for use mid-sentence unless it looks like an acronym. */
export function midSentence(label: string): string {
  if (label.length < 2) return label;
  const second = label[1] as string;
  return second === second.toLocaleLowerCase('es') ? label[0]!.toLocaleLowerCase('es') + label.slice(1) : label;
}

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export function weekdayName(isoWeekday: number): string {
  return WEEKDAY_NAMES[isoWeekday - 1] ?? '';
}

export function trimTime(t: string): string {
  return t.slice(0, 5);
}
