import type { Catalog } from '../catalog/catalog.repository.js';
import { localDateOf } from '../shared/time.js';
import { formatTime } from './format.js';
import type { ConversationState } from './state.js';

/** Compact, human-readable state description for the LLM context (no IDs). */
export function summarizeState(state: ConversationState, catalog: Catalog, tz: string): string {
  const name = (id: string) => catalog.services.find((s) => s.id === id)?.name ?? 'servicio';
  const names = (ids: readonly string[]) => (ids.length > 0 ? ids.map(name).join(' + ') : '(sin servicio elegido)');
  const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const flow = (p: 'BOOK' | 'RESCHEDULE') => (p === 'BOOK' ? 'reserva nueva' : 'cambio de una cita existente');
  switch (state.kind) {
    case 'IDLE':
      return state.focusServiceIds && state.focusServiceIds.length > 0
        ? `Sin proceso en curso. Último servicio comentado: ${names(state.focusServiceIds)}.`
        : 'Sin proceso en curso.';
    case 'COLLECTING': {
      if (state.awaiting === 'SERVICE') {
        const choices = state.serviceChoices?.map((id, i) => `${i + 1}) ${name(id)}`).join(' ') ?? '';
        return `Proceso: ${flow(state.purpose)}. El asistente preguntó qué servicio quiere${choices ? `, con estas opciones: ${choices}` : ''}.`;
      }
      if (state.awaiting === 'DATE') return `Proceso: ${flow(state.purpose)} de ${names(state.serviceIds)}. El asistente preguntó qué día le viene bien.`;
      return `Proceso: ${flow(state.purpose)} de ${names(state.serviceIds)} para el ${state.date ? ddmm(state.date) : '?'}. El asistente preguntó si prefiere mañana o tarde.`;
    }
    case 'OFFERING_SLOTS': {
      const opts = state.slots.map((s, i) => `${i + 1}) ${formatTime(new Date(s.start), tz)}`).join(' ');
      return `Proceso: ${flow(state.purpose)} de ${names(state.serviceIds)}. El asistente ofreció para el ${ddmm(state.date)} estas opciones: ${opts}. Espera que el cliente elija una.`;
    }
    case 'CONFIRMING_BOOKING': {
      const start = new Date(state.slot.start);
      return `Proceso: ${flow(state.purpose)} de ${names(state.serviceIds)}. El asistente preguntó si confirma el ${ddmm(localDateOf(start, tz))} a las ${formatTime(start, tz)} (espera sí o no).`;
    }
    case 'CONFIRMING_CANCELLATION':
      return 'El asistente preguntó si quiere cancelar su cita (espera sí o no).';
    case 'CHOOSING_APPOINTMENT':
      return `El asistente pidió elegir cuál de sus ${state.appointmentIds.length} citas quiere ${state.purpose === 'CANCEL' ? 'cancelar' : state.purpose === 'RESCHEDULE' ? 'cambiar' : 'confirmar'} (opciones numeradas).`;
    case 'OFFERING_HANDOFF':
      return 'El asistente ofreció avisar a una persona del equipo (espera sí o no).';
  }
}
