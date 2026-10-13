import type { Tx } from '../db/database.js';
import type { Business, Customer } from '../db/types.js';
import type { Catalog, CatalogService } from '../catalog/catalog.repository.js';
import { loadBusinessHours } from '../catalog/catalog.repository.js';
import type { CrmEventType } from '../crm/crm-events.js';
import { sanitizeStatedName } from '../crm/customers.js';
import { textMessage, type OutboundContent } from '../messaging/content.js';
import { pickNearestSlots, pickSpreadSlots, type Slot } from '../scheduling/availability-engine.js';
import { getAppointmentView, getUpcomingAppointments, type AppointmentView } from '../scheduling/appointments.repository.js';
import {
  resolveServicesAndStaff,
  validateBookingDate,
  type AvailabilityService,
  type ResolvedBooking,
} from '../scheduling/availability.service.js';
import type { BookingService } from '../scheduling/booking.service.js';
import { addLocalDays, localDateOf, localMinutesOfDay } from '../shared/time.js';
import { resolveDateExpr, windowFor } from './dates.js';
import { formatLongDateInline, formatTime, midSentence, relativeDayLabel, servicesLabel } from './format.js';
import { CONFIDENCE, type Interpretation, type TimePreference } from './interpretation.js';
import type { Command } from './quick-parse.js';
import * as R from './replies.js';
import { IDLE, clarificationsOf, newOfferId, type ConversationState, type StoredSlot } from './state.js';

/**
 * Deterministic dialog engine: (state, validated input) -> replies + new
 * state + side effects through the service layer. The LLM output reaches this
 * module only as a validated `Interpretation`; every fact in a reply comes
 * from the database and every state-changing action requires an explicit
 * customer choice of an option generated here.
 */

export type DialogInput =
  | { kind: 'command'; command: Command }
  | { kind: 'interpretation'; interpretation: Interpretation }
  | { kind: 'unsupported' }
  | { kind: 'llm_failure' };

export interface DialogEvent {
  type: CrmEventType;
  data: Record<string, unknown>;
  dedupeKey?: string;
  appointmentId?: string | null;
}

export interface DialogOutcome {
  replies: OutboundContent[];
  state: ConversationState;
  handoff: { reason: string } | null;
  events: DialogEvent[];
  outcome: string;
  appointmentId: string | null;
  customerName: string | null;
  bookingIntent: boolean;
}

export interface DialogContext {
  trx: Tx;
  now: Date;
  /** Local date (business tz) when the customer wrote: relative dates resolve against it. */
  messageDate: string;
  business: Business;
  catalog: Catalog;
  customer: Customer;
  conversationId: string;
  state: ConversationState;
  stateExpired: boolean;
  /** Prefix the first reply with "Hola <nombre> 👋". */
  greet: boolean;
  /** Stable per-turn key (last inbound message id) for idempotent side effects. */
  turnKey: string;
  searchDays: number;
  availability: AvailabilityService;
  booking: BookingService;
}

interface Frame {
  purpose: 'BOOK' | 'RESCHEDULE';
  appointmentId: string | null;
  serviceIds: string[];
  staffId: string | null;
  date: string | null;
  timePref: TimePreference | null;
  ambiguousServiceIds?: string[];
}

const toStored = (s: Slot): StoredSlot => ({ start: s.start.toISOString(), staffIds: s.staffIds });

export class Dialog {
  private readonly out: DialogOutcome;
  private greetingUsed = false;
  private readonly env: R.ReplyEnv;

  constructor(private readonly ctx: DialogContext) {
    this.out = { replies: [], state: ctx.state, handoff: null, events: [], outcome: 'NONE', appointmentId: null, customerName: null, bookingIntent: false };
    this.env = {
      businessName: ctx.business.name,
      timezone: ctx.business.timezone,
      currency: ctx.business.currency,
      today: localDateOf(ctx.now, ctx.business.timezone),
    };
  }

  async run(input: DialogInput): Promise<DialogOutcome> {
    switch (input.kind) {
      case 'unsupported':
        this.reply(R.unsupportedMediaReply());
        this.done('UNSUPPORTED_MEDIA');
        return this.out;
      case 'llm_failure': {
        const offerId = newOfferId();
        this.reply(R.llmFailureReply(offerId));
        this.setState({ kind: 'OFFERING_HANDOFF', offerId });
        this.done('LLM_FALLBACK');
        return this.out;
      }
      case 'command':
        await this.onCommand(input.command);
        return this.out;
      case 'interpretation':
        await this.onInterpretation(input.interpretation);
        return this.out;
    }
  }

  // ---------------------------------------------------------------------------
  // Deterministic commands (buttons, "2", "18:30", "sí")
  // ---------------------------------------------------------------------------

  private async onCommand(cmd: Command): Promise<void> {
    const state = this.ctx.state;
    switch (cmd.type) {
      case 'HANDOFF':
        return this.handoff(cmd.explicitRequest ? 'CUSTOMER_REQUEST' : 'OFFER_ACCEPTED');
      case 'UNKNOWN_REPLY':
        return this.staleOption();
      case 'APPOINTMENT_ACTION':
        return this.onAppointmentAction(cmd.action, cmd.appointmentId, cmd.version);
      case 'SELECT_OPTION': {
        if (cmd.offerId !== null && !this.offerMatches(cmd.offerId)) return this.staleOption();
        if (state.kind === 'OFFERING_SLOTS') {
          const slot = state.slots[cmd.index];
          if (!slot) return this.invalidOption(state.slots.length);
          return this.commitSlot(state, slot);
        }
        if (state.kind === 'CHOOSING_APPOINTMENT') {
          const id = state.appointmentIds[cmd.index];
          if (!id) return this.invalidOption(state.appointmentIds.length);
          return this.onAppointmentChosen(state.purpose, id, state.date, state.timePref);
        }
        if (state.kind === 'COLLECTING' && state.awaiting === 'SERVICE' && state.serviceChoices) {
          const serviceId = state.serviceChoices[cmd.index];
          if (!serviceId) return this.invalidOption(state.serviceChoices.length);
          return this.advanceFrame({ ...this.frameOf(state), serviceIds: [serviceId] });
        }
        return this.noContext();
      }
      case 'SELECT_TIME': {
        if (state.kind !== 'OFFERING_SLOTS') return this.noContext();
        const slot = state.slots.find((s) => localMinutesOfDay(new Date(s.start), this.ctx.business.timezone) === cmd.minutes);
        if (slot) return this.commitSlot(state, slot);
        // A time that was not offered: check that exact time on the same day.
        return this.advanceFrame({ ...this.frameOf(state), timePref: { kind: 'EXACT', minutes: cmd.minutes } });
      }
      case 'ANSWER': {
        if (cmd.offerId !== null && !this.offerMatches(cmd.offerId)) return this.staleOption();
        return this.onAnswer(cmd.answer);
      }
      case 'TIME_OF_DAY': {
        if (cmd.offerId !== null && !this.offerMatches(cmd.offerId)) return this.staleOption();
        if (state.kind === 'COLLECTING' && state.awaiting === 'TIME_OF_DAY') {
          return this.advanceFrame({ ...this.frameOf(state), timePref: { kind: 'RANGE', range: cmd.value } });
        }
        return this.noContext();
      }
    }
  }

  private async onAnswer(answer: 'YES' | 'NO'): Promise<void> {
    const state = this.ctx.state;
    switch (state.kind) {
      case 'CONFIRMING_BOOKING':
        if (answer === 'YES') return this.commitSlot(state, state.slot);
        this.reply(textMessage('Vale. 🙂 ¿Qué otro día u hora te viene bien?'));
        this.setState({
          kind: 'COLLECTING',
          purpose: state.purpose,
          appointmentId: state.appointmentId,
          serviceIds: state.serviceIds,
          staffId: state.staffId,
          date: null,
          timePref: null,
          awaiting: 'DATE',
          offerId: newOfferId(),
          clarifications: 0,
        });
        return this.done('BOOKING_DECLINED');
      case 'CONFIRMING_CANCELLATION':
        if (answer === 'YES') return this.doCancel(state.appointmentId);
        this.reply(R.keptAppointmentReply(this.env, await getAppointmentView(this.ctx.trx, this.ctx.business.id, state.appointmentId)));
        this.setState(IDLE);
        return this.done('CANCELLATION_DECLINED');
      case 'OFFERING_HANDOFF':
        if (answer === 'YES') return this.handoff('OFFER_ACCEPTED');
        this.reply(R.declinedHandoffReply());
        this.setState(IDLE);
        return this.done('HANDOFF_DECLINED');
      default:
        return this.noContext();
    }
  }

  // ---------------------------------------------------------------------------
  // LLM interpretations
  // ---------------------------------------------------------------------------

  private async onInterpretation(i: Interpretation): Promise<void> {
    const state = this.ctx.state;
    this.event('INTENT_DETECTED', { intent: i.intent, confidence: Math.round(i.confidence * 100) / 100, tentative: i.tentative });
    if (i.customerName && !this.ctx.customer.name && i.confidence >= CONFIDENCE.act) {
      const name = sanitizeStatedName(i.customerName);
      if (name) this.out.customerName = name;
    }

    if (i.intent === 'HUMAN_HANDOFF' && i.confidence >= CONFIDENCE.handoff) return this.handoff('CUSTOMER_REQUEST');

    // 1. Answers to the question currently on the table.
    if (state.kind === 'OFFERING_SLOTS') {
      const byOption = i.selectedOption !== null ? state.slots[i.selectedOption - 1] : undefined;
      const exact = i.timePreference?.kind === 'EXACT' ? i.timePreference.minutes : null;
      const byTime =
        exact !== null && i.date === null
          ? state.slots.find((s) => localMinutesOfDay(new Date(s.start), this.ctx.business.timezone) === exact)
          : undefined;
      const chosen = byOption ?? byTime;
      // Only a booking-style message selects a slot ("¿cuánto cuesta la segunda?" must not book),
      // and asking for a different professional means recomputing the options, not booking these.
      const selectionIntent = (['BOOK_APPOINTMENT', 'ASK_AVAILABILITY', 'RESCHEDULE_APPOINTMENT', 'UNKNOWN'] as const).some((x) => x === i.intent);
      const sameStaff = i.staffId === null || i.staffId === state.staffId;
      if (chosen && !i.tentative && selectionIntent && sameStaff) {
        if (i.confidence >= CONFIDENCE.act) return this.commitSlot(state, chosen);
        return this.askConfirmSlot(state, chosen);
      }
    }
    if ((state.kind === 'CONFIRMING_BOOKING' || state.kind === 'CONFIRMING_CANCELLATION' || state.kind === 'OFFERING_HANDOFF') && i.answer) {
      if (i.confidence >= CONFIDENCE.act) return this.onAnswer(i.answer);
      this.reply(textMessage('Perdona, ¿me lo confirmas con un *sí* o un *no*?'));
      return this.done('ANSWER_UNCLEAR');
    }
    if (state.kind === 'CHOOSING_APPOINTMENT' && i.selectedOption !== null && i.confidence >= CONFIDENCE.act) {
      const id = state.appointmentIds[i.selectedOption - 1];
      if (id) return this.onAppointmentChosen(state.purpose, id, state.date, state.timePref);
    }
    if (state.kind === 'COLLECTING' && state.awaiting === 'SERVICE' && state.serviceChoices && i.selectedOption !== null && i.confidence >= CONFIDENCE.act) {
      const serviceId = state.serviceChoices[i.selectedOption - 1];
      if (serviceId) return this.advanceFrame({ ...this.frameOf(state), serviceIds: [serviceId] });
    }

    // 2. Follow-ups that complete an ongoing booking frame ("mañana", "por la tarde", "con Ana").
    const flowIntents = ['ASK_AVAILABILITY', 'BOOK_APPOINTMENT', 'RESCHEDULE_APPOINTMENT', 'UNKNOWN', 'GREETING'] as const;
    const inFrame = state.kind === 'COLLECTING' || state.kind === 'OFFERING_SLOTS' || state.kind === 'CONFIRMING_BOOKING';
    const carriesFrameData = i.date !== null || i.timePreference !== null || i.serviceIds.length > 0 || i.ambiguousServiceIds.length > 0 || i.staffId !== null;
    if (inFrame && carriesFrameData && (flowIntents as readonly string[]).includes(i.intent) && i.confidence >= CONFIDENCE.understand) {
      const base = this.frameOf(state);
      if (i.intent !== 'RESCHEDULE_APPOINTMENT' || base.purpose === 'RESCHEDULE') {
        this.out.bookingIntent = true;
        return this.advanceFrame(this.mergeFrame(base, i));
      }
    }

    // 3. Fresh intent routing.
    if (i.intent === 'UNKNOWN' || i.confidence < CONFIDENCE.understand) return this.clarify();
    switch (i.intent) {
      case 'GREETING':
        this.reply(R.greetingReply(this.env, this.out.customerName ?? this.ctx.customer.name));
        this.greetingUsed = true;
        if (state.kind !== 'IDLE') return this.done('GREETING');
        this.setState({ kind: 'IDLE', clarifications: 0 });
        return this.done('GREETING');
      case 'ASK_SERVICES':
        this.reply(R.servicesListReply(this.env, this.ctx.catalog.services, this.greeting()));
        return this.done('SERVICES_LISTED');
      case 'ASK_PRICE': {
        const ids = i.serviceIds.length > 0 ? i.serviceIds : i.ambiguousServiceIds.length > 0 ? i.ambiguousServiceIds : this.focusServiceIds();
        const services = this.servicesByIds(ids);
        if (services.length === 0) {
          this.reply(R.servicesListReply(this.env, this.ctx.catalog.services, this.greeting()));
          return this.done('PRICES_LISTED');
        }
        this.reply(R.priceReply(this.env, services, this.greeting()));
        this.setState({ kind: 'IDLE', focusServiceIds: services.map((s) => s.id), clarifications: 0 });
        this.serviceInterest(services);
        return this.done('PRICE_ANSWERED');
      }
      case 'ASK_AVAILABILITY':
      case 'BOOK_APPOINTMENT': {
        this.out.bookingIntent = true;
        const base: Frame = inFrame && this.frameOf(state).purpose === 'BOOK' ? this.frameOf(state) : this.emptyFrame();
        return this.advanceFrame(this.mergeFrame(base, i));
      }
      case 'RESCHEDULE_APPOINTMENT':
        return this.startAppointmentFlow('RESCHEDULE', i);
      case 'CANCEL_APPOINTMENT':
        return this.startAppointmentFlow('CANCEL', i);
      case 'CONFIRM_APPOINTMENT':
        return this.startAppointmentFlow('CONFIRM', i);
      case 'ASK_LOCATION':
        this.reply(R.locationReply(this.env, this.ctx.business.address, this.ctx.business.maps_url, this.greeting()));
        return this.done('LOCATION');
      case 'ASK_OPENING_HOURS': {
        const hours = await loadBusinessHours(this.ctx.trx, this.ctx.business.id);
        const closures = await this.upcomingClosures();
        this.reply(R.openingHoursReply(hours, closures, this.greeting()));
        return this.done('OPENING_HOURS');
      }
      case 'ASK_EMPLOYEE':
        this.reply(R.staffReply(this.ctx.catalog.staff, this.greeting()));
        return this.done('STAFF_LISTED');
      case 'ASK_EXISTING_APPOINTMENT': {
        const list = await getUpcomingAppointments(this.ctx.trx, this.ctx.business.id, this.ctx.customer.id, this.ctx.now);
        this.reply(R.upcomingAppointmentsReply(this.env, list, this.ctx.catalog.staff.length > 1, this.greeting()));
        return this.done('APPOINTMENTS_LISTED');
      }
      case 'OUT_OF_SCOPE':
        this.reply(R.outOfScopeReply(this.env));
        return this.done('OUT_OF_SCOPE');
      case 'HUMAN_HANDOFF': {
        const offerId = newOfferId();
        this.reply(R.offerHandoffReply(offerId, 'Si lo prefieres, te atiende una persona.'));
        this.setState({ kind: 'OFFERING_HANDOFF', offerId });
        return this.done('HANDOFF_OFFERED');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Booking frame
  // ---------------------------------------------------------------------------

  private emptyFrame(): Frame {
    return { purpose: 'BOOK', appointmentId: null, serviceIds: this.focusServiceIds(), staffId: null, date: null, timePref: null };
  }

  private frameOf(state: ConversationState): Frame {
    switch (state.kind) {
      case 'COLLECTING':
      case 'OFFERING_SLOTS':
        return { purpose: state.purpose, appointmentId: state.appointmentId, serviceIds: state.serviceIds, staffId: state.staffId, date: state.date, timePref: state.timePref };
      case 'CONFIRMING_BOOKING':
        return {
          purpose: state.purpose,
          appointmentId: state.appointmentId,
          serviceIds: state.serviceIds,
          staffId: state.staffId,
          date: localDateOf(new Date(state.slot.start), this.ctx.business.timezone),
          timePref: null,
        };
      default:
        return this.emptyFrame();
    }
  }

  private mergeFrame(base: Frame, i: Interpretation): Frame {
    const next: Frame = { ...base };
    if (i.serviceIds.length > 0 && base.purpose === 'BOOK') next.serviceIds = i.serviceIds;
    if (i.ambiguousServiceIds.length > 0 && i.serviceIds.length === 0 && base.purpose === 'BOOK') {
      next.serviceIds = [];
      next.ambiguousServiceIds = i.ambiguousServiceIds;
    }
    if (i.staffId) next.staffId = i.staffId;
    if (i.date) {
      next.date = resolveDateExpr(i.date, this.ctx.messageDate) ?? 'INVALID';
      if (!i.timePreference) next.timePref = null;
    }
    if (i.timePreference) next.timePref = i.timePreference;
    return next;
  }

  private async advanceFrame(frame: Frame, depth = 0): Promise<void> {
    const { trx, business } = this.ctx;
    this.out.bookingIntent = true;

    // --- Services -------------------------------------------------------------
    let serviceIds = frame.serviceIds;
    if (frame.purpose === 'RESCHEDULE') {
      const appt = frame.appointmentId ? await getAppointmentView(trx, business.id, frame.appointmentId) : null;
      if (!appt || appt.customerId !== this.ctx.customer.id || (appt.status !== 'BOOKED' && appt.status !== 'CONFIRMED')) {
        this.reply(R.appointmentNotActiveReply());
        this.setState(IDLE);
        return this.done('APPOINTMENT_NOT_ACTIVE');
      }
      serviceIds = appt.services.map((s) => s.serviceId);
    }
    if (serviceIds.length === 0) {
      const candidates = this.servicesByIds(frame.ambiguousServiceIds ?? []).filter((s) => s.bookableOnline);
      const choices = candidates.length >= 2 ? candidates : this.bookableServices().slice(0, 10);
      const offerId = newOfferId();
      this.reply(R.askServiceReply(choices, offerId, this.greeting(), candidates.length >= 2 ? '¿Qué servicio quieres exactamente?' : undefined));
      this.setState({
        kind: 'COLLECTING',
        purpose: 'BOOK',
        appointmentId: null,
        serviceIds: [],
        staffId: frame.staffId,
        date: frame.date === 'INVALID' ? null : frame.date,
        timePref: frame.timePref,
        awaiting: 'SERVICE',
        offerId,
        serviceChoices: choices.map((s) => s.id),
        clarifications: 0,
      });
      return this.done('ASKED_SERVICE');
    }

    const resolved = await resolveServicesAndStaff(trx, business.id, serviceIds, frame.staffId, 'WHATSAPP');
    if (!resolved.ok) {
      switch (resolved.reason) {
        case 'STAFF_NOT_FOUND':
        case 'STAFF_INCOMPATIBLE': {
          if (depth > 0) break;
          const staffName = this.ctx.catalog.staff.find((s) => s.id === frame.staffId)?.name;
          this.reply(textMessage(`${staffName ?? 'Esa persona'} no realiza ${midSentence(servicesLabel(this.namesOf(serviceIds)))}, así que te busco hueco con el resto del equipo.`));
          return this.advanceFrame({ ...frame, staffId: null }, depth + 1);
        }
        case 'SERVICE_NOT_BOOKABLE': {
          const offerId = newOfferId();
          this.reply(R.offerHandoffReply(offerId, `${servicesLabel(this.namesOf(serviceIds))} necesita una valoración previa con el equipo, así que no puedo reservarlo por aquí.`));
          this.setState({ kind: 'OFFERING_HANDOFF', offerId });
          return this.done('SERVICE_NOT_BOOKABLE');
        }
        case 'NO_STAFF_FOR_SERVICES': {
          const offerId = newOfferId();
          this.reply(R.offerHandoffReply(offerId, 'Esa combinación de servicios no la puedo reservar por aquí.'));
          this.setState({ kind: 'OFFERING_HANDOFF', offerId });
          return this.done('NO_STAFF_FOR_SERVICES');
        }
        case 'SERVICE_NOT_FOUND':
          break;
      }
      this.reply(textMessage('Ese servicio ya no está disponible. 🙏'));
      return this.advanceFrame({ ...frame, serviceIds: [], ambiguousServiceIds: [] }, depth + 1);
    }
    const names = resolved.value.services.map((s) => s.name);
    if (frame.purpose === 'BOOK') this.serviceInterest(resolved.value.services);

    // --- Date ---------------------------------------------------------------------
    const collecting = (awaiting: 'DATE' | 'TIME_OF_DAY', date: string | null): ConversationState => ({
      kind: 'COLLECTING',
      purpose: frame.purpose,
      appointmentId: frame.appointmentId,
      serviceIds,
      staffId: frame.staffId,
      date,
      timePref: frame.timePref,
      awaiting,
      offerId: newOfferId(),
      clarifications: 0,
    });
    if (frame.date === null || frame.date === 'INVALID') {
      if (frame.date === 'INVALID') this.reply(R.invalidDateReply(this.greeting()));
      else if (frame.purpose === 'RESCHEDULE') this.reply(textMessage(`${this.greetingPrefix()}¿A qué día te gustaría mover la cita?`));
      else this.reply(R.askDateReply(names, this.greeting()));
      this.setState(collecting('DATE', null));
      return this.done('ASKED_DATE');
    }
    const validity = validateBookingDate(business, frame.date, this.ctx.now);
    if (validity !== 'OK') {
      if (validity === 'DATE_IN_PAST') this.reply(R.dateInPastReply(this.greeting()));
      else if (validity === 'DATE_TOO_FAR') this.reply(R.dateTooFarReply(business.max_booking_days_ahead, this.greeting()));
      else this.reply(R.invalidDateReply(this.greeting()));
      this.setState(collecting('DATE', null));
      return this.done(validity);
    }

    // --- Slots ------------------------------------------------------------------------
    const exclude = frame.purpose === 'RESCHEDULE' ? (frame.appointmentId ?? undefined) : undefined;
    const allSlots = await this.ctx.availability.slotsForDate(trx, business, resolved.value, frame.date, { now: this.ctx.now, excludeAppointmentId: exclude });
    const pref = frame.timePref;

    if (pref === null) {
      if (allSlots.length === 0) return this.noSlots(frame, resolved.value, names, null);
      const hasMorning = allSlots.some((s) => localMinutesOfDay(s.start, business.timezone) < 14 * 60);
      const hasAfternoon = allSlots.some((s) => localMinutesOfDay(s.start, business.timezone) >= 14 * 60);
      if (allSlots.length > 3 && hasMorning && hasAfternoon) {
        const st = collecting('TIME_OF_DAY', frame.date);
        this.reply(R.askTimeOfDayReply(relativeDayLabel(frame.date, this.env.today), (st as { offerId: string }).offerId, this.greeting()));
        this.setState(st);
        return this.done('ASKED_TIME_OF_DAY');
      }
      return this.offer(frame, serviceIds, names, frame.date, pickSpreadSlots(allSlots, 3));
    }

    if (pref.kind === 'EXACT') {
      const exact = allSlots.find((s) => localMinutesOfDay(s.start, business.timezone) === pref.minutes);
      if (exact) {
        const offerId = newOfferId();
        this.reply(R.confirmBookingQuestion(this.env, exact, names, offerId, this.greeting(), frame.purpose));
        this.setState({
          kind: 'CONFIRMING_BOOKING',
          purpose: frame.purpose,
          appointmentId: frame.appointmentId,
          offerId,
          serviceIds,
          staffId: frame.staffId,
          slot: toStored(exact),
          clarifications: 0,
        });
        return this.done('ASKED_BOOKING_CONFIRMATION');
      }
      if (allSlots.length === 0) return this.noSlots(frame, resolved.value, names, null);
      const target = allSlots[0]!.start; // any instant on that date; we only need the wall-clock target
      const targetInstant = new Date(target.getTime() + (pref.minutes - localMinutesOfDay(target, business.timezone)) * 60_000);
      const intro = `A las ${String(Math.floor(pref.minutes / 60)).padStart(2, '0')}:${String(pref.minutes % 60).padStart(2, '0')} no queda hueco ${relativeDayLabel(frame.date, this.env.today)}, pero tengo:`;
      return this.offer(frame, serviceIds, names, frame.date, pickNearestSlots(allSlots, targetInstant, 3), intro);
    }

    const window = windowFor(pref);
    const inWindow = window
      ? allSlots.filter((s) => {
          const m = localMinutesOfDay(s.start, business.timezone);
          return m >= window.fromMinutes && m < window.toMinutes;
        })
      : allSlots;
    if (inWindow.length > 0) return this.offer(frame, serviceIds, names, frame.date, pickSpreadSlots(inWindow, 3));
    if (allSlots.length > 0) {
      const day = relativeDayLabel(frame.date, this.env.today);
      const intro = `${day[0]!.toLocaleUpperCase('es')}${day.slice(1)} ${rangeLabel(pref)} no queda hueco para ${midSentence(servicesLabel(names))}, pero tengo:`;
      return this.offer(frame, serviceIds, names, frame.date, pickSpreadSlots(allSlots, 3), intro);
    }
    return this.noSlots(frame, resolved.value, names, pref);
  }

  private async noSlots(frame: Frame, resolved: ResolvedBooking, names: string[], pref: TimePreference | null): Promise<void> {
    const { trx, business } = this.ctx;
    const date = frame.date as string;
    const exclude = frame.purpose === 'RESCHEDULE' ? (frame.appointmentId ?? undefined) : undefined;
    const opts = { now: this.ctx.now, excludeAppointmentId: exclude };
    const range = pref && pref.kind === 'RANGE' ? windowFor(pref) : undefined;
    let next = await this.ctx.availability.firstAvailableDate(trx, business, resolved, addLocalDays(date, 1), this.ctx.searchDays, { ...opts, window: range });
    if (!next && range) next = await this.ctx.availability.firstAvailableDate(trx, business, resolved, addLocalDays(date, 1), this.ctx.searchDays, opts);
    const head = R.noAvailabilityReply(this.env, { date, serviceNames: names, rangeLabel: pref && pref.kind === 'RANGE' ? rangeLabel(pref) : null, greeting: this.greeting() });
    if (next) {
      const intro = `${head}\n\nEl primer hueco disponible es ${relativeDayLabel(next.date, this.env.today)} (${formatLongDateInline(next.date)}):`;
      return this.offer({ ...frame, date: next.date }, resolved.services.map((s) => s.id), names, next.date, pickSpreadSlots(next.slots, 3), intro);
    }
    const offerId = newOfferId();
    this.reply(R.offerHandoffReply(offerId, `${head}\n\nTampoco tengo huecos en los próximos ${this.ctx.searchDays} días.`));
    this.setState({ kind: 'OFFERING_HANDOFF', offerId });
    return this.done('NO_AVAILABILITY');
  }

  private offer(frame: Frame, serviceIds: string[], names: string[], date: string, slots: Slot[], intro?: string): void {
    const offerId = newOfferId();
    this.reply(R.slotOptionsReply(this.env, { slots, offerId, serviceNames: names, date, ...(intro ? { intro } : {}), greeting: this.greeting(), purpose: frame.purpose }));
    this.setState({
      kind: 'OFFERING_SLOTS',
      purpose: frame.purpose,
      appointmentId: frame.appointmentId,
      offerId,
      serviceIds,
      staffId: frame.staffId,
      date,
      timePref: frame.timePref,
      slots: slots.map(toStored),
      clarifications: 0,
    });
    this.event('AVAILABILITY_OFFERED', { date, serviceIds, options: slots.map((s) => s.start.toISOString()), purpose: frame.purpose });
    this.done('OFFERED_SLOTS');
  }

  private askConfirmSlot(state: Extract<ConversationState, { kind: 'OFFERING_SLOTS' }>, slot: StoredSlot): void {
    const offerId = newOfferId();
    const s: Slot = { start: new Date(slot.start), end: new Date(slot.start), occupiedUntil: new Date(slot.start), staffIds: slot.staffIds };
    this.reply(R.confirmBookingQuestion(this.env, s, this.namesOf(state.serviceIds), offerId, this.greeting(), state.purpose));
    this.setState({
      kind: 'CONFIRMING_BOOKING',
      purpose: state.purpose,
      appointmentId: state.appointmentId,
      offerId,
      serviceIds: state.serviceIds,
      staffId: state.staffId,
      slot,
      clarifications: 0,
    });
    this.done('ASKED_BOOKING_CONFIRMATION');
  }

  /** The customer explicitly chose a backend-generated slot: book / reschedule with re-validation. */
  private async commitSlot(
    state: { purpose: 'BOOK' | 'RESCHEDULE'; appointmentId: string | null; serviceIds: string[]; staffId: string | null; timePref?: TimePreference | null },
    slot: StoredSlot,
  ): Promise<void> {
    const { trx, business, customer } = this.ctx;
    const startsAt = new Date(slot.start);
    const idempotencyKey = `wa:${this.ctx.turnKey}`;
    this.out.bookingIntent = true;

    if (state.purpose === 'RESCHEDULE' && state.appointmentId) {
      const res = await this.ctx.booking.reschedule(trx, {
        business,
        appointmentId: state.appointmentId,
        customerId: customer.id,
        newStartsAt: startsAt,
        staffId: state.staffId,
        preferredStaffIds: slot.staffIds,
        source: 'WHATSAPP',
        idempotencyKey,
        now: this.ctx.now,
      });
      if (res.ok) {
        this.reply(R.rescheduledReply(this.env, res.appointment));
        this.setState(IDLE);
        this.out.appointmentId = res.appointment.id;
        return this.done('RESCHEDULED');
      }
      if (res.reason === 'SLOT_UNAVAILABLE' || res.reason === 'OUTSIDE_BOOKING_WINDOW') return this.reofferAfterConflict(state, startsAt);
      this.reply(R.appointmentNotActiveReply());
      this.setState(IDLE);
      return this.done(`RESCHEDULE_FAILED_${res.reason}`);
    }

    const res = await this.ctx.booking.book(trx, {
      business,
      customerId: customer.id,
      serviceIds: state.serviceIds,
      staffId: state.staffId,
      preferredStaffIds: slot.staffIds,
      startsAt,
      source: 'WHATSAPP',
      conversationId: this.ctx.conversationId,
      idempotencyKey,
      now: this.ctx.now,
    });
    if (res.ok) {
      const pending = await trx
        .selectFrom('jobs')
        .select('id')
        .where('group_key', '=', `appt:${res.appointment.id}`)
        .where('status', '=', 'PENDING')
        .executeTakeFirst();
      this.reply(R.bookingConfirmedReply(this.env, res.appointment, pending !== undefined, this.ctx.catalog.staff.length > 1));
      this.setState(IDLE);
      this.out.appointmentId = res.appointment.id;
      return this.done('BOOKED');
    }
    if (res.reason === 'SLOT_UNAVAILABLE' || res.reason === 'OUTSIDE_BOOKING_WINDOW') return this.reofferAfterConflict(state, startsAt);
    this.reply(R.bookingErrorReply());
    this.setState(IDLE);
    return this.done(`BOOKING_FAILED_${res.reason}`);
  }

  private async reofferAfterConflict(
    state: { purpose: 'BOOK' | 'RESCHEDULE'; appointmentId: string | null; serviceIds: string[]; staffId: string | null; timePref?: TimePreference | null },
    startsAt: Date,
  ): Promise<void> {
    this.reply(textMessage(R.slotTakenIntro()));
    return this.advanceFrame({
      purpose: state.purpose,
      appointmentId: state.appointmentId,
      serviceIds: state.serviceIds,
      staffId: state.staffId,
      date: localDateOf(startsAt, this.ctx.business.timezone),
      timePref: state.timePref && state.timePref.kind !== 'EXACT' ? state.timePref : null,
    });
  }

  // ---------------------------------------------------------------------------
  // Existing appointments: cancel / reschedule / confirm
  // ---------------------------------------------------------------------------

  private async startAppointmentFlow(purpose: 'CANCEL' | 'RESCHEDULE' | 'CONFIRM', i: Interpretation): Promise<void> {
    const { trx, business, customer } = this.ctx;
    let list = await getUpcomingAppointments(trx, business.id, customer.id, this.ctx.now, 10);
    if (purpose === 'CONFIRM') {
      const pendingConfirm = list.filter((a) => a.status === 'BOOKED');
      if (pendingConfirm.length === 0 && list.length > 0) {
        this.reply(textMessage(`${this.greetingPrefix()}Tu cita ya está confirmada. ✅ ¡Te esperamos!`));
        return this.done('ALREADY_CONFIRMED');
      }
      list = pendingConfirm;
    }
    if (list.length === 0) {
      this.reply(R.noUpcomingForActionReply(this.greeting()));
      this.setState(IDLE);
      return this.done('NO_UPCOMING_APPOINTMENTS');
    }
    const mentionedDate = i.date ? resolveDateExpr(i.date, this.ctx.messageDate) : null;
    // For cancel/confirm the date identifies the existing appointment; for
    // reschedule it is the NEW date.
    let candidates = list;
    if (purpose !== 'RESCHEDULE' && mentionedDate) {
      const onDate = list.filter((a) => localDateOf(a.startsAt, business.timezone) === mentionedDate);
      if (onDate.length > 0) candidates = onDate;
    }
    const newDate = purpose === 'RESCHEDULE' ? mentionedDate : null;
    if (candidates.length === 1) return this.onAppointmentChosen(purpose, candidates[0]!.id, newDate, i.timePreference);
    const offerId = newOfferId();
    const shown = candidates.slice(0, 10);
    this.reply(R.chooseAppointmentReply(this.env, shown, offerId, purpose, this.greeting()));
    this.setState({ kind: 'CHOOSING_APPOINTMENT', offerId, purpose, appointmentIds: shown.map((a) => a.id), date: newDate, timePref: i.timePreference, clarifications: 0 });
    return this.done('ASKED_WHICH_APPOINTMENT');
  }

  private async onAppointmentChosen(
    purpose: 'CANCEL' | 'RESCHEDULE' | 'CONFIRM',
    appointmentId: string,
    newDate: string | null,
    timePref: TimePreference | null,
  ): Promise<void> {
    const appt = await this.ownedActiveAppointment(appointmentId);
    if (!appt) {
      this.reply(R.appointmentNotActiveReply());
      this.setState(IDLE);
      return this.done('APPOINTMENT_NOT_ACTIVE');
    }
    switch (purpose) {
      case 'CANCEL': {
        const offerId = newOfferId();
        this.reply(R.confirmCancellationQuestion(this.env, appt, offerId, this.greeting()));
        this.setState({ kind: 'CONFIRMING_CANCELLATION', offerId, appointmentId: appt.id, clarifications: 0 });
        return this.done('ASKED_CANCELLATION_CONFIRMATION');
      }
      case 'CONFIRM':
        return this.doConfirm(appt, undefined);
      case 'RESCHEDULE':
        if (!newDate) {
          this.reply(R.askRescheduleDateReply(this.env, appt, this.greeting()));
          this.setState({
            kind: 'COLLECTING',
            purpose: 'RESCHEDULE',
            appointmentId: appt.id,
            serviceIds: appt.services.map((s) => s.serviceId),
            staffId: null,
            date: null,
            timePref,
            awaiting: 'DATE',
            offerId: newOfferId(),
            clarifications: 0,
          });
          return this.done('ASKED_RESCHEDULE_DATE');
        }
        return this.advanceFrame({ purpose: 'RESCHEDULE', appointmentId: appt.id, serviceIds: appt.services.map((s) => s.serviceId), staffId: null, date: newDate, timePref });
    }
  }

  /** Buttons from the confirmation/reminder notification (template quick replies). */
  private async onAppointmentAction(action: 'CONFIRM' | 'CANCEL', appointmentId: string, version: number): Promise<void> {
    const appt = await this.ownedActiveAppointment(appointmentId);
    if (!appt) {
      this.reply(R.appointmentNotActiveReply());
      return this.done('APPOINTMENT_ACTION_REJECTED');
    }
    if (appt.version !== version) {
      this.reply(R.appointmentChangedReply(this.env, appt));
      return this.done('APPOINTMENT_VERSION_MISMATCH');
    }
    if (action === 'CONFIRM') return this.doConfirm(appt, version);
    const offerId = newOfferId();
    this.reply(R.confirmCancellationQuestion(this.env, appt, offerId, null));
    this.setState({ kind: 'CONFIRMING_CANCELLATION', offerId, appointmentId: appt.id, clarifications: 0 });
    return this.done('ASKED_CANCELLATION_CONFIRMATION');
  }

  private async doConfirm(appt: AppointmentView, expectedVersion: number | undefined): Promise<void> {
    const res = await this.ctx.booking.confirm(this.ctx.trx, {
      business: this.ctx.business,
      appointmentId: appt.id,
      customerId: this.ctx.customer.id,
      ...(expectedVersion !== undefined ? { expectedVersion } : {}),
      now: this.ctx.now,
    });
    if (res.ok) {
      this.reply(R.attendanceConfirmedReply(this.env, res.appointment));
      this.setState(IDLE);
      this.out.appointmentId = appt.id;
      return this.done('CONFIRMED');
    }
    this.reply(R.appointmentNotActiveReply());
    this.setState(IDLE);
    return this.done(`CONFIRM_FAILED_${res.reason}`);
  }

  private async doCancel(appointmentId: string): Promise<void> {
    const res = await this.ctx.booking.cancel(this.ctx.trx, {
      business: this.ctx.business,
      appointmentId,
      customerId: this.ctx.customer.id,
      source: 'CUSTOMER_WHATSAPP',
      now: this.ctx.now,
    });
    if (res.ok) {
      this.reply(R.cancelledReply(this.env, res.appointment));
      this.setState(IDLE);
      this.out.appointmentId = appointmentId;
      return this.done(res.alreadyCancelled ? 'ALREADY_CANCELLED' : 'CANCELLED');
    }
    this.reply(R.appointmentNotActiveReply());
    this.setState(IDLE);
    return this.done(`CANCEL_FAILED_${res.reason}`);
  }

  private async ownedActiveAppointment(appointmentId: string): Promise<AppointmentView | null> {
    const appt = await getAppointmentView(this.ctx.trx, this.ctx.business.id, appointmentId);
    // Authorization: the appointment must belong to THIS customer of THIS tenant.
    if (!appt || appt.customerId !== this.ctx.customer.id) return null;
    if (appt.status !== 'BOOKED' && appt.status !== 'CONFIRMED') return null;
    if (appt.startsAt.getTime() <= this.ctx.now.getTime()) return null;
    return appt;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private handoff(reason: string): void {
    this.out.handoff = { reason };
    this.reply(R.handoffAckReply());
    this.setState(IDLE);
    this.done('HANDOFF');
  }

  private clarify(): void {
    const n = clarificationsOf(this.ctx.state) + 1;
    if (n >= 3) {
      const offerId = newOfferId();
      this.reply(R.offerHandoffReply(offerId, 'Parece que no consigo entenderte bien. 🙏'));
      this.setState({ kind: 'OFFERING_HANDOFF', offerId });
      this.done('HANDOFF_OFFERED_AFTER_CLARIFICATIONS');
      return;
    }
    this.reply(R.clarificationReply(this.greeting()));
    const s = this.ctx.state;
    this.setState(s.kind === 'OFFERING_HANDOFF' ? IDLE : { ...s, clarifications: n });
    this.done('CLARIFICATION');
  }

  private noContext(): void {
    this.reply(this.ctx.stateExpired ? R.expiredContextReply(this.greeting()) : R.clarificationReply(this.greeting()));
    this.setState(IDLE);
    this.done(this.ctx.stateExpired ? 'EXPIRED_CONTEXT' : 'NO_CONTEXT');
  }

  private staleOption(): void {
    const s = this.ctx.state;
    this.reply(R.staleOptionReply());
    if (s.kind === 'OFFERING_SLOTS') {
      this.reply(
        R.slotOptionsReply(this.env, {
          slots: s.slots.map((x) => ({ start: new Date(x.start), end: new Date(x.start), occupiedUntil: new Date(x.start), staffIds: x.staffIds })),
          offerId: s.offerId,
          serviceNames: this.namesOf(s.serviceIds),
          date: s.date,
          greeting: null,
          purpose: s.purpose,
        }),
      );
    } else if (s.kind === 'IDLE') {
      this.reply(textMessage('¿Qué necesitas? Puedo ayudarte a reservar, cambiar o cancelar una cita.'));
    }
    this.done('STALE_OPTION');
  }

  private invalidOption(count: number): void {
    this.reply(textMessage(`Elige una de las opciones, del 1 al ${count}. 🙂`));
    this.done('INVALID_OPTION');
  }

  private offerMatches(offerId: string): boolean {
    const s = this.ctx.state;
    return 'offerId' in s && s.offerId === offerId;
  }

  private greeting(): string | null {
    if (!this.ctx.greet || this.greetingUsed) return null;
    this.greetingUsed = true;
    return R.greetingLine(this.out.customerName ?? this.ctx.customer.name);
  }

  private greetingPrefix(): string {
    const g = this.greeting();
    return g ? `${g}\n\n` : '';
  }

  private focusServiceIds(): string[] {
    const s = this.ctx.state;
    if (s.kind === 'IDLE') return s.focusServiceIds ?? [];
    if ('serviceIds' in s) return s.serviceIds;
    return [];
  }

  private servicesByIds(ids: readonly string[]): CatalogService[] {
    return ids.map((id) => this.ctx.catalog.services.find((s) => s.id === id)).filter((s): s is CatalogService => s !== undefined);
  }

  private bookableServices(): CatalogService[] {
    return this.ctx.catalog.services.filter((s) => s.bookableOnline);
  }

  private namesOf(ids: readonly string[]): string[] {
    return this.servicesByIds(ids).map((s) => s.name);
  }

  private serviceInterest(services: CatalogService[]): void {
    if (services.length === 0) return;
    const ids = services.map((s) => s.id).sort();
    this.event(
      'SERVICE_INTEREST',
      { serviceIds: ids, services: services.map((s) => s.name) },
      `service_interest:${this.ctx.conversationId}:${this.ctx.messageDate}:${ids.join(',')}`,
    );
  }

  private async upcomingClosures(): Promise<Array<{ label: string }>> {
    const { trx, business, now } = this.ctx;
    const rows = await trx
      .selectFrom('time_off')
      .select(['starts_at', 'ends_at', 'kind'])
      .where('business_id', '=', business.id)
      .where('staff_id', 'is', null)
      .where('ends_at', '>', now)
      .where('starts_at', '<', new Date(now.getTime() + 14 * 24 * 3_600_000))
      .orderBy('starts_at')
      .limit(5)
      .execute();
    return rows.map((r) => ({ label: `${formatLongDateInline(localDateOf(r.starts_at, business.timezone))}${r.kind === 'BREAK' || r.kind === 'BLOCK' ? ` (${formatTime(r.starts_at, business.timezone)}-${formatTime(r.ends_at, business.timezone)})` : ''}` }));
  }

  private reply(content: OutboundContent): void {
    this.out.replies.push(content);
  }

  private setState(state: ConversationState): void {
    this.out.state = state;
  }

  private event(type: CrmEventType, data: Record<string, unknown>, dedupeKey?: string): void {
    this.out.events.push({ type, data, ...(dedupeKey ? { dedupeKey } : {}) });
  }

  private done(outcome: string): void {
    this.out.outcome = outcome;
  }
}

function rangeLabel(pref: TimePreference): string {
  switch (pref.kind) {
    case 'RANGE':
      return pref.range === 'MORNING' ? 'por la mañana' : pref.range === 'AFTERNOON' ? 'por la tarde' : 'por la noche';
    case 'AFTER':
      return `a partir de las ${String(Math.floor(pref.minutes / 60)).padStart(2, '0')}:${String(pref.minutes % 60).padStart(2, '0')}`;
    case 'BEFORE':
      return `antes de las ${String(Math.floor(pref.minutes / 60)).padStart(2, '0')}:${String(pref.minutes % 60).padStart(2, '0')}`;
    case 'EXACT':
      return `a las ${String(Math.floor(pref.minutes / 60)).padStart(2, '0')}:${String(pref.minutes % 60).padStart(2, '0')}`;
  }
}
