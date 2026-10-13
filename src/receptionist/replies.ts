import { buttonsMessage, listMessage, textMessage, type OutboundContent } from '../messaging/content.js';
import type { Slot } from '../scheduling/availability-engine.js';
import type { AppointmentView } from '../scheduling/appointments.repository.js';
import type { CatalogService, CatalogStaff } from '../catalog/catalog.repository.js';
import type { WeeklyHours } from '../scheduling/availability-engine.js';
import { localDateOf } from '../shared/time.js';
import {
  clockEmoji,
  formatLongDate,
  formatLongDateInline,
  formatPrice,
  formatServicePrice,
  formatTime,
  midSentence,
  numberEmoji,
  relativeDayLabel,
  servicesLabel,
  trimTime,
  weekdayName,
} from './format.js';
import { encodeReplyId } from './reply-ids.js';

/**
 * Customer-facing Spanish copy. Every fact (time, price, name, address) is
 * passed in from the database; nothing here is produced by the LLM.
 */

export interface ReplyEnv {
  businessName: string;
  timezone: string;
  currency: string;
  /** Local date of "today" for relative labels. */
  today: string;
}

export function greetingLine(name: string | null): string {
  return name ? `Hola ${name} 👋` : '¡Hola! 👋';
}

function withGreeting(greeting: string | null, body: string): string {
  return greeting ? `${greeting}\n\n${body}` : body;
}

export const CAPABILITIES =
  'Puedo ayudarte a *reservar, cambiar o cancelar* una cita y a resolver dudas sobre *servicios, precios, horarios* y dónde estamos.';

export function greetingReply(env: ReplyEnv, name: string | null): OutboundContent {
  return textMessage(`${greetingLine(name)} Soy el asistente de ${env.businessName}.\n\n${CAPABILITIES}\n\n¿En qué te ayudo?`);
}

export function outOfScopeReply(env: ReplyEnv): OutboundContent {
  return textMessage(`Puedo ayudarte con citas, horarios y servicios de ${env.businessName}. 😊 ¿Quieres reservar o consultar algo?`);
}

export function clarificationReply(greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, `Perdona, no te he entendido bien. 🙏\n\n${CAPABILITIES}\n\n¿Me lo cuentas de otra forma?`));
}

export function expiredContextReply(greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, 'Perdona, ha pasado un rato y no sé a qué te refieres. 🙏 ¿Qué necesitas? Puedo ayudarte a reservar, cambiar o cancelar una cita.'));
}

export function staleOptionReply(): OutboundContent {
  return textMessage('Esa opción ya no está vigente. 🙏 Te enseño las opciones actualizadas.');
}

export function unsupportedMediaReply(): OutboundContent {
  return textMessage('Ahora mismo solo puedo leer mensajes de texto. ✍️ ¿Me lo escribes, por favor?');
}

export function handoffAckReply(): OutboundContent {
  return textMessage('Te paso con una persona del equipo. 🙋 Te responderán por aquí lo antes posible.');
}

export function llmFailureReply(offerId: string): OutboundContent {
  return buttonsMessage('No he podido procesar tu solicitud ahora mismo. 😕\n\nPuedo avisar al equipo para que te atiendan. ¿Quieres que lo haga?', [
    { id: encodeReplyId({ action: 'HANDOFF', offerId }), title: 'Sí, avisad al equipo' },
    { id: encodeReplyId({ action: 'NO', offerId }), title: 'No, gracias' },
  ]);
}

export function offerHandoffReply(offerId: string, reason: string): OutboundContent {
  return buttonsMessage(`${reason}\n\n¿Quieres que avise a una persona del equipo?`, [
    { id: encodeReplyId({ action: 'HANDOFF', offerId }), title: 'Sí, por favor' },
    { id: encodeReplyId({ action: 'NO', offerId }), title: 'No, gracias' },
  ]);
}

export function declinedHandoffReply(): OutboundContent {
  return textMessage('De acuerdo. 😊 Si necesitas algo más, escríbeme cuando quieras.');
}

// --- Catalog information --------------------------------------------------

export function servicesListReply(env: ReplyEnv, services: CatalogService[], greeting: string | null): OutboundContent {
  if (services.length === 0) return textMessage(withGreeting(greeting, 'Ahora mismo no tengo servicios disponibles para mostrar. Te paso con el equipo si lo necesitas.'));
  const byCategory = new Map<string, CatalogService[]>();
  for (const s of services) {
    const k = s.category ?? 'Otros';
    byCategory.set(k, [...(byCategory.get(k) ?? []), s]);
  }
  const lines: string[] = [];
  for (const [cat, list] of byCategory) {
    lines.push(`*${cat}*`);
    for (const s of list) lines.push(`• ${s.name} — ${formatServicePrice(s, env.currency)} (${s.durationMinutes} min)`);
  }
  return textMessage(withGreeting(greeting, `Estos son nuestros servicios:\n\n${lines.join('\n')}\n\n¿Quieres reservar alguno?`));
}

export function priceReply(env: ReplyEnv, services: CatalogService[], greeting: string | null): OutboundContent {
  if (services.length === 1) {
    const s = services[0] as CatalogService;
    const sentence =
      s.priceType === 'ON_REQUEST' || s.priceCents === null
        ? `El precio de ${midSentence(s.name)} depende del trabajo; te lo confirma el equipo en el salón.`
        : s.priceType === 'FROM'
          ? `${s.name} cuesta desde ${formatPrice(s.priceCents, env.currency)} (el precio final depende del trabajo).`
          : `${s.name} cuesta ${formatPrice(s.priceCents, env.currency)}.`;
    return textMessage(withGreeting(greeting, `${sentence}\n\n¿Quieres que te busque hueco?`));
  }
  const lines = services.map((s) => `• ${s.name}: ${formatServicePrice(s, env.currency)}`);
  return textMessage(withGreeting(greeting, `Estos son los precios:\n\n${lines.join('\n')}\n\n¿Quieres que te busque hueco?`));
}

export function locationReply(env: ReplyEnv, address: string | null, mapsUrl: string | null, greeting: string | null): OutboundContent {
  if (!address) return textMessage(withGreeting(greeting, `Ahora mismo no tengo la dirección a mano. Te la confirma el equipo de ${env.businessName}.`));
  return textMessage(withGreeting(greeting, `📍 Estamos en ${address}.${mapsUrl ? `\n\nCómo llegar: ${mapsUrl}` : ''}`));
}

export function openingHoursReply(hours: WeeklyHours[], closures: Array<{ label: string }>, greeting: string | null): OutboundContent {
  const lines: string[] = [];
  for (let d = 1; d <= 7; d++) {
    const day = hours.filter((h) => h.weekday === d).sort((a, b) => a.start.localeCompare(b.start));
    const label = weekdayName(d);
    lines.push(`• ${label[0]!.toLocaleUpperCase('es')}${label.slice(1)}: ${day.length === 0 ? 'cerrado' : day.map((h) => `${trimTime(h.start)}–${trimTime(h.end)}`).join(' y ')}`);
  }
  const extra = closures.length > 0 ? `\n\n⚠️ Próximos cierres: ${closures.map((c) => c.label).join(', ')}.` : '';
  return textMessage(withGreeting(greeting, `🕐 Nuestro horario:\n\n${lines.join('\n')}${extra}`));
}

export function staffReply(staff: CatalogStaff[], greeting: string | null): OutboundContent {
  if (staff.length === 0) return textMessage(withGreeting(greeting, 'Te lo confirma el equipo en el salón.'));
  return textMessage(withGreeting(greeting, `Nuestro equipo: ${staff.map((s) => s.name).join(', ')}. 💈\n\nSi quieres cita con alguien en concreto, dímelo al reservar.`));
}

// --- Booking flow -----------------------------------------------------------

export function askServiceReply(services: CatalogService[], offerId: string, greeting: string | null, intro?: string): OutboundContent {
  const text = withGreeting(greeting, intro ?? '¿Qué servicio quieres reservar?');
  if (services.length >= 1 && services.length <= 3) {
    return buttonsMessage(text, services.map((s, i) => ({ id: encodeReplyId({ action: 'SVC', offerId, index: i }), title: s.name })));
  }
  if (services.length >= 1 && services.length <= 10) {
    return listMessage(
      text,
      'Ver servicios',
      services.map((s, i) => ({ id: encodeReplyId({ action: 'SVC', offerId, index: i }), title: s.name, description: `${s.durationMinutes} min` })),
    );
  }
  return textMessage(`${text}\n\nPor ejemplo: ${services.slice(0, 5).map((s) => s.name).join(', ')}.`);
}

export function askDateReply(serviceNames: string[], greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, `Perfecto, ${midSentence(servicesLabel(serviceNames))}. ✂️ ¿Qué día te viene bien?`));
}

export function askTimeOfDayReply(dayLabel: string, offerId: string, greeting: string | null): OutboundContent {
  const cap = dayLabel[0]!.toLocaleUpperCase('es') + dayLabel.slice(1);
  return buttonsMessage(withGreeting(greeting, `¿${cap} por la mañana o por la tarde?`), [
    { id: encodeReplyId({ action: 'TOD', offerId, value: 'MORNING' }), title: 'Por la mañana' },
    { id: encodeReplyId({ action: 'TOD', offerId, value: 'AFTERNOON' }), title: 'Por la tarde' },
  ]);
}

export function slotOptionsReply(
  env: ReplyEnv,
  params: { slots: Slot[]; offerId: string; serviceNames: string[]; date: string; intro?: string; greeting: string | null; purpose: 'BOOK' | 'RESCHEDULE' },
): OutboundContent {
  const dayLabel = relativeDayLabel(params.date, env.today);
  const svc = midSentence(servicesLabel(params.serviceNames));
  const intro =
    params.intro ??
    (params.purpose === 'RESCHEDULE'
      ? `Para ${dayLabel} puedo moverte la cita a:`
      : `Sí. Para ${dayLabel} tenemos disponibilidad para ${svc}:`);
  const list = params.slots.map((s, i) => `${numberEmoji(i + 1)} ${formatTime(s.start, env.timezone)}`).join('\n');
  const question = params.purpose === 'RESCHEDULE' ? '¿Cuál prefieres?' : '¿Con cuál te quedas?';
  const text = withGreeting(params.greeting, `${intro}\n\n${list}\n\n${question}`);
  const options = params.slots.map((s, i) => ({ id: encodeReplyId({ action: 'SLOT', offerId: params.offerId, index: i }), title: formatTime(s.start, env.timezone) }));
  if (options.length <= 3) return buttonsMessage(text, options);
  return listMessage(text, 'Ver horarios', options);
}

export function confirmBookingQuestion(env: ReplyEnv, slot: Slot, serviceNames: string[], offerId: string, greeting: string | null, purpose: 'BOOK' | 'RESCHEDULE'): OutboundContent {
  const date = localDateOf(slot.start, env.timezone);
  const q =
    purpose === 'RESCHEDULE'
      ? `¿Te cambio la cita a ${relativeDayLabel(date, env.today)} (${formatLongDateInline(date)}) a las ${formatTime(slot.start, env.timezone)}?`
      : `Hay hueco ${relativeDayLabel(date, env.today)} (${formatLongDateInline(date)}) a las ${formatTime(slot.start, env.timezone)} para ${midSentence(servicesLabel(serviceNames))}. ¿Te lo reservo?`;
  return buttonsMessage(withGreeting(greeting, q), [
    { id: encodeReplyId({ action: 'YES', offerId }), title: purpose === 'RESCHEDULE' ? 'Sí, cámbiala' : 'Sí, resérvalo' },
    { id: encodeReplyId({ action: 'NO', offerId }), title: 'No' },
  ]);
}

export function bookingConfirmedReply(env: ReplyEnv, a: AppointmentView, remindersScheduled: boolean, showStaff: boolean): OutboundContent {
  const date = localDateOf(a.startsAt, env.timezone);
  const lines = [
    'Perfecto ✅',
    '',
    'Tu cita queda reservada:',
    '',
    `📅 ${formatLongDate(date)}`,
    `${clockEmoji(a.startsAt, env.timezone)} ${formatTime(a.startsAt, env.timezone)}`,
    `✂️ ${servicesLabel(a.services.map((s) => s.name))}`,
  ];
  if (showStaff) lines.push(`💈 Con ${a.staffName}`);
  if (a.totalPriceCents !== null) lines.push(`💶 ${a.priceIsEstimate ? 'Desde ' : ''}${formatPrice(a.totalPriceCents, a.currency)}`);
  lines.push('');
  lines.push(remindersScheduled ? 'Te enviaremos un recordatorio antes de tu cita.' : 'Si necesitas cambiarla o cancelarla, escríbeme por aquí.');
  return textMessage(lines.join('\n'));
}

export function rescheduledReply(env: ReplyEnv, a: AppointmentView): OutboundContent {
  const date = localDateOf(a.startsAt, env.timezone);
  return textMessage(
    [
      'Hecho ✅ Tu cita queda cambiada a:',
      '',
      `📅 ${formatLongDate(date)}`,
      `${clockEmoji(a.startsAt, env.timezone)} ${formatTime(a.startsAt, env.timezone)}`,
      `✂️ ${servicesLabel(a.services.map((s) => s.name))}`,
      '',
      'Te avisaremos antes de la nueva hora.',
    ].join('\n'),
  );
}

export function noAvailabilityReply(
  env: ReplyEnv,
  params: { date: string; serviceNames: string[]; rangeLabel: string | null; greeting: string | null },
): string {
  const day = relativeDayLabel(params.date, env.today);
  const cap = day[0]!.toLocaleUpperCase('es') + day.slice(1);
  return withGreeting(params.greeting, `${cap}${params.rangeLabel ? ` ${params.rangeLabel}` : ''} no nos queda hueco para ${midSentence(servicesLabel(params.serviceNames))}. 😕`);
}

export function slotTakenIntro(): string {
  return 'Vaya, ese hueco se acaba de ocupar. 😕';
}

export function dateInPastReply(greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, 'Esa fecha ya ha pasado. 🙂 ¿Qué otro día te viene bien?'));
}

export function dateTooFarReply(maxDays: number, greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, `Solo puedo reservar con hasta ${maxDays} días de antelación. ¿Te viene bien una fecha más cercana?`));
}

export function invalidDateReply(greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, 'No he entendido bien la fecha. 🙏 ¿Me dices el día? Por ejemplo: "mañana", "el jueves" o "el 20 de octubre".'));
}

// --- Existing appointments ------------------------------------------------------

export function appointmentLine(env: ReplyEnv, a: AppointmentView, showStaff: boolean): string {
  const date = localDateOf(a.startsAt, env.timezone);
  return `${formatLongDateInline(date)} a las ${formatTime(a.startsAt, env.timezone)} — ${servicesLabel(a.services.map((s) => s.name))}${showStaff ? ` (con ${a.staffName})` : ''}`;
}

export function upcomingAppointmentsReply(env: ReplyEnv, list: AppointmentView[], showStaff: boolean, greeting: string | null): OutboundContent {
  if (list.length === 0) return textMessage(withGreeting(greeting, 'No tienes ninguna cita próxima. ¿Quieres reservar una?'));
  const lines = list.map((a) => `• ${appointmentLine(env, a, showStaff)}${a.status === 'CONFIRMED' ? ' ✅' : ''}`);
  return textMessage(withGreeting(greeting, `${list.length === 1 ? 'Tienes esta cita:' : 'Tienes estas citas:'}\n\n${lines.join('\n')}`));
}

export function noUpcomingForActionReply(greeting: string | null): OutboundContent {
  return textMessage(withGreeting(greeting, 'No encuentro ninguna cita próxima a tu nombre. 🤔 Si crees que es un error, te paso con el equipo.'));
}

export function chooseAppointmentReply(env: ReplyEnv, list: AppointmentView[], offerId: string, purpose: 'CANCEL' | 'RESCHEDULE' | 'CONFIRM', greeting: string | null): OutboundContent {
  const verb = purpose === 'CANCEL' ? 'cancelar' : purpose === 'RESCHEDULE' ? 'cambiar' : 'confirmar';
  const lines = list.map((a, i) => `${numberEmoji(i + 1)} ${appointmentLine(env, a, false)}`).join('\n');
  const text = withGreeting(greeting, `¿Qué cita quieres ${verb}?\n\n${lines}`);
  const opts = list.map((a, i) => ({
    id: encodeReplyId({ action: 'APPT', offerId, index: i }),
    title: `${formatTime(a.startsAt, env.timezone)} ${localDateOf(a.startsAt, env.timezone).slice(8, 10)}/${localDateOf(a.startsAt, env.timezone).slice(5, 7)}`,
  }));
  return opts.length <= 3 ? buttonsMessage(text, opts) : listMessage(text, 'Ver citas', opts);
}

export function confirmCancellationQuestion(env: ReplyEnv, a: AppointmentView, offerId: string, greeting: string | null): OutboundContent {
  const date = localDateOf(a.startsAt, env.timezone);
  return buttonsMessage(
    withGreeting(greeting, `¿Quieres cancelar tu cita de ${relativeDayLabel(date, env.today)} (${formatLongDateInline(date)}) a las ${formatTime(a.startsAt, env.timezone)}?`),
    [
      { id: encodeReplyId({ action: 'YES', offerId }), title: 'Sí, cancelar' },
      { id: encodeReplyId({ action: 'NO', offerId }), title: 'No' },
    ],
  );
}

export function cancelledReply(env: ReplyEnv, a: AppointmentView): OutboundContent {
  const date = localDateOf(a.startsAt, env.timezone);
  return textMessage(`Tu cita del ${formatLongDateInline(date)} a las ${formatTime(a.startsAt, env.timezone)} ha sido cancelada. ❌\n\nSi quieres reservar otro día, escríbeme cuando quieras.`);
}

export function keptAppointmentReply(env: ReplyEnv, a: AppointmentView | null): OutboundContent {
  if (!a) return textMessage('Perfecto, no cambio nada. 😊');
  const date = localDateOf(a.startsAt, env.timezone);
  return textMessage(`Perfecto, mantenemos tu cita del ${formatLongDateInline(date)} a las ${formatTime(a.startsAt, env.timezone)}. 😊`);
}

export function askRescheduleDateReply(env: ReplyEnv, a: AppointmentView, greeting: string | null): OutboundContent {
  const date = localDateOf(a.startsAt, env.timezone);
  return textMessage(withGreeting(greeting, `Vale, cambiamos tu cita del ${formatLongDateInline(date)} a las ${formatTime(a.startsAt, env.timezone)}. ¿A qué día te gustaría moverla?`));
}

export function attendanceConfirmedReply(env: ReplyEnv, a: AppointmentView): OutboundContent {
  const date = localDateOf(a.startsAt, env.timezone);
  return textMessage(`¡Gracias! Tu cita del ${formatLongDateInline(date)} a las ${formatTime(a.startsAt, env.timezone)} queda confirmada. ✅ ¡Te esperamos!`);
}

export function appointmentNotActiveReply(): OutboundContent {
  return textMessage('Esa cita ya no está activa. Si quieres reservar otra, dime qué día te viene bien. 😊');
}

export function appointmentChangedReply(env: ReplyEnv, a: AppointmentView): OutboundContent {
  return textMessage(`Esa cita ha cambiado. Tu cita actual es el ${appointmentLine(env, a, false)}. Si quieres cancelarla o cambiarla, dímelo.`);
}

export function bookingErrorReply(): OutboundContent {
  return textMessage('Vaya, no he podido completar la reserva. 😕 ¿Lo intentamos con otro horario o prefieres que te atienda una persona del equipo?');
}
