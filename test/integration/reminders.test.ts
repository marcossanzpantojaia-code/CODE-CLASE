import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app.js';
import type { DB } from '../../src/db/database.js';
import { createTestDatabase, type TestDatabase } from '../helpers/db.js';
import { MutableClock, TEST_NOW } from '../helpers/clock.js';
import { CustomerSim } from '../helpers/customer-sim.js';
import { buttonIds, buttonTitles, FakeGraphApi } from '../helpers/fake-graph-api.js';
import { createCustomer, madrid, PILOT_PHONE_NUMBER_ID, pilotSalonConfig, seedTenant, type SeededTenant } from '../helpers/fixtures.js';
import { ScriptedInterpreter } from '../helpers/scripted-interpreter.js';
import { createTestApp } from '../helpers/test-app.js';

describe('Confirmation request & reminders (integration)', () => {
  let tdb: TestDatabase;
  let db: DB;
  let app: App;
  let salon: SeededTenant;
  let customerId: string;
  let marcos: CustomerSim;
  const clock = new MutableClock(TEST_NOW);
  const graph = new FakeGraphApi();
  const llm = new ScriptedInterpreter();

  beforeAll(async () => {
    tdb = await createTestDatabase();
    db = tdb.handle.db;
    await graph.start();
    salon = await seedTenant(db, pilotSalonConfig(), { receptionist: true });
    app = await createTestApp({ databaseUrl: tdb.url, clock, graphUrl: graph.url, interpreter: llm });
  });
  afterAll(async () => {
    await app.stop('test');
    await graph.stop();
    await tdb.drop();
  });
  beforeEach(async () => {
    clock.set(TEST_NOW);
    graph.reset();
    for (const t of ['jobs', 'incidents', 'crm_events', 'messages', 'appointment_services', 'appointments', 'conversations', 'customers'] as const) await db.deleteFrom(t).execute();
    customerId = await createCustomer(db, salon.business.id, '+34600000001', 'Marcos');
    marcos = new CustomerSim(app, graph, clock, PILOT_PHONE_NUMBER_ID, '34600000001');
  });

  /** Thursday 15 Oct 18:30 -> confirmation request Wed 18:30, reminder Thu 16:30. */
  const book = async () => {
    const res = await db.transaction().execute((trx) =>
      app.services.booking.book(trx, {
        business: salon.business,
        customerId,
        serviceIds: [salon.service('Corte + barba')],
        staffId: null,
        startsAt: madrid('2026-10-15', '18:30'),
        source: 'STAFF',
        now: clock.now(),
      }),
    );
    if (!res.ok) throw new Error(res.reason);
    return res.appointment;
  };

  it('outside the 24h window the confirmation request uses the approved template with quick replies', async () => {
    const appt = await book();
    clock.set(madrid('2026-10-14', '18:30'));
    await app.worker!.drain();
    expect(graph.sent).toHaveLength(1);
    const body = graph.sent[0]!.body as { type: string; template: { name: string; components: Array<{ type: string; parameters: Array<{ text?: string; payload?: string }> }> } };
    expect(body.type).toBe('template');
    expect(body.template.name).toBe('cita_confirmacion');
    expect(body.template.components[0]?.parameters.map((p) => p.text)).toEqual(['Marcos', 'Barbería Piloto', 'jueves 15 de octubre', '18:30', 'Corte + barba']);
    expect(body.template.components.slice(1).map((c) => c.parameters[0]?.payload)).toEqual([`APPT_CONFIRM:${appt.id}:1`, `APPT_CANCEL:${appt.id}:1`]);
    const crm = await db.selectFrom('crm_events').select('type').where('type', '=', 'CONFIRMATION_REQUEST_SENT').execute();
    expect(crm).toHaveLength(1);
  });

  it('inside the 24h window it uses interactive buttons; "Confirmar" confirms the appointment', async () => {
    const appt = await book();
    clock.set(madrid('2026-10-14', '12:00'));
    await marcos.say('hola'); // opens the 24h window (no rule -> clarification reply)
    clock.set(madrid('2026-10-14', '18:30'));
    await app.worker!.drain();
    const last = marcos.lastMessage!;
    expect(last.body.type).toBe('interactive');
    expect(buttonTitles(last.body)).toEqual(['Confirmar', 'Cancelar cita']);
    expect(buttonIds(last.body)[0]).toBe(`APPT_CONFIRM:${appt.id}:1`);
    marcos.newReplies();
    const r = await marcos.tap('Confirmar');
    expect(r[0]).toContain('queda confirmada');
    const row = await db.selectFrom('appointments').select(['status', 'version']).executeTakeFirstOrThrow();
    expect(row).toEqual({ status: 'CONFIRMED', version: 1 });
    // The 2h reminder is still valid after confirming (version unchanged).
    clock.set(madrid('2026-10-15', '16:30'));
    await app.worker!.drain();
    expect(marcos.newReplies().join('\n')).toContain('⏰ Recordatorio');
  });

  it('template quick reply "Cancelar cita" asks for confirmation before cancelling', async () => {
    const appt = await book();
    clock.set(madrid('2026-10-14', '18:30'));
    await app.worker!.drain(); // template confirmation request goes out
    expect(marcos.newReplies()).toEqual(['[template:cita_confirmacion]']);
    clock.set(madrid('2026-10-14', '18:31'));
    let r = await marcos.tapTemplateButton(`APPT_CANCEL:${appt.id}:1`, 'Cancelar cita');
    expect(r[0]).toContain('¿Quieres cancelar tu cita');
    r = await marcos.tap('Sí, cancelar');
    expect(r[0]).toContain('ha sido cancelada');
    expect((await db.selectFrom('appointments').select('status').executeTakeFirstOrThrow()).status).toBe('CANCELLED');
    clock.set(madrid('2026-10-15', '16:30'));
    await app.worker!.drain();
    expect(marcos.newReplies()).toEqual([]); // no reminder after cancelling
  });

  it('with the bot off (reminders still on), a "Cancelar cita" tap is not lost: it lands in the team queue', async () => {
    await db.updateTable('businesses').set({ automated_receptionist_enabled: false }).where('id', '=', salon.business.id).execute();
    try {
      const appt = await book();
      clock.set(madrid('2026-10-14', '18:30'));
      await app.worker!.drain();
      expect(marcos.newReplies()).toEqual(['[template:cita_confirmacion]']);
      clock.set(madrid('2026-10-14', '18:31'));
      expect(await marcos.tapTemplateButton(`APPT_CANCEL:${appt.id}:1`, 'Cancelar cita')).toEqual([]);
      // No automatic action, but the team sees it (needs_human) and the appointment is untouched.
      const conv = await db.selectFrom('conversations').select(['needs_human', 'needs_human_reason']).executeTakeFirstOrThrow();
      expect(conv).toEqual({ needs_human: true, needs_human_reason: 'BOT_DISABLED' });
      expect((await db.selectFrom('appointments').select('status').executeTakeFirstOrThrow()).status).toBe('BOOKED');
    } finally {
      await db.updateTable('businesses').set({ automated_receptionist_enabled: true }).where('id', '=', salon.business.id).execute();
    }
  });

  it('a stale button (appointment rescheduled since) is rejected without acting', async () => {
    const appt = await book();
    await db.transaction().execute((trx) =>
      app.services.booking.reschedule(trx, { business: salon.business, appointmentId: appt.id, newStartsAt: madrid('2026-10-16', '11:00'), source: 'STAFF', now: clock.now() }),
    );
    const r = await marcos.tapTemplateButton(`APPT_CONFIRM:${appt.id}:1`, 'Confirmar');
    expect(r[0]).toContain('Esa cita ha cambiado');
    expect((await db.selectFrom('appointments').select('status').executeTakeFirstOrThrow()).status).toBe('BOOKED');
  });

  it('a button carrying ANOTHER customer’s appointment id is refused (no IDOR)', async () => {
    const appt = await book();
    const laura = new CustomerSim(app, graph, clock, PILOT_PHONE_NUMBER_ID, '34600000002');
    const r = await laura.tapTemplateButton(`APPT_CANCEL:${appt.id}:1`, 'Cancelar cita');
    expect(r[0]).toContain('Esa cita ya no está activa');
    expect((await db.selectFrom('appointments').select('status').executeTakeFirstOrThrow()).status).toBe('BOOKED');
  });

  it('without a configured template, nothing is sent outside the window and an incident is recorded', async () => {
    await db.updateTable('whatsapp_channels').set({ confirmation_template_name: null }).execute();
    try {
      await book();
      clock.set(madrid('2026-10-14', '18:30'));
      await app.worker!.drain();
      expect(graph.sent).toHaveLength(0);
      const incident = await db.selectFrom('incidents').selectAll().executeTakeFirstOrThrow();
      expect(incident.kind).toBe('TEMPLATE_NOT_CONFIGURED');
    } finally {
      await db.updateTable('whatsapp_channels').set({ confirmation_template_name: 'cita_confirmacion' }).execute();
    }
  });

  it('reminders disabled for the tenant: jobs are not even scheduled', async () => {
    await db.updateTable('businesses').set({ reminders_enabled: false }).execute();
    try {
      const fresh = await db.selectFrom('businesses').selectAll().where('id', '=', salon.business.id).executeTakeFirstOrThrow();
      const res = await db.transaction().execute((trx) =>
        app.services.booking.book(trx, { business: fresh, customerId, serviceIds: [salon.service('Barba')], staffId: null, startsAt: madrid('2026-10-15', '11:00'), source: 'STAFF', now: clock.now() }),
      );
      expect(res.ok && res.notifications).toEqual([]);
      expect(await db.selectFrom('jobs').selectAll().where('type', '=', 'appointment.notify').execute()).toHaveLength(0);
    } finally {
      await db.updateTable('businesses').set({ reminders_enabled: true }).execute();
    }
  });
});
