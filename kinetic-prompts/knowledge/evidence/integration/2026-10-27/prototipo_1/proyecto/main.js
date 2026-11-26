// Barbería Castellana · prototipo. JS nativo, sin dependencias.
// La página es completa sin JS; esto solo añade menú móvil, revelados y validación del formulario.
(() => {
  'use strict';

  // ---------- Cabecera sólida al salir de la parte alta ----------
  const header = document.querySelector('.site-header');
  const sentinel = document.querySelector('.top-sentinel');
  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-solid', !entry.isIntersecting);
    }).observe(sentinel);
  }

  // ---------- Menú móvil ----------
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('menu');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // ---------- Revelados al hacer scroll ----------
  // El CSS solo oculta .reveal si hay JS y no se pidió reducir movimiento; aquí solo se marca como visible.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target); // se revela una vez
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // ---------- Formulario de reserva (demostración: no envía nada) ----------
  const form = document.getElementById('booking');
  if (!form) return;

  const status = document.getElementById('form-status');
  const fields = [...form.querySelectorAll('input, select')];
  const dateInput = form.elements.fecha;
  const timeInput = form.elements.hora;

  form.noValidate = true; // mensajes propios en español; sin JS sigue la validación nativa

  // Fecha mínima: hoy, en hora local
  const now = new Date();
  dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const messages = {
    nombre: { valueMissing: 'Escribe tu nombre.' },
    tel: {
      valueMissing: 'Escribe un teléfono de contacto.',
      patternMismatch: 'Usa entre 9 y 15 números, espacios o el signo +.',
    },
    servicio: { valueMissing: 'Elige un servicio.' },
    fecha: {
      valueMissing: 'Elige un día.',
      rangeUnderflow: 'El día no puede ser anterior a hoy.',
      badInput: 'Escribe una fecha válida.',
    },
    hora: { valueMissing: 'Elige una hora.' },
  };

  // Reglas de horario: cerrado domingo y lunes; el sábado se cierra a las 17:00
  function checkSchedule() {
    dateInput.setCustomValidity('');
    timeInput.setCustomValidity('');
    if (!dateInput.value) return;
    const [y, m, d] = dateInput.value.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    if (day === 0 || day === 1) {
      dateInput.setCustomValidity('Cerramos domingos y lunes. Elige de martes a sábado.');
    } else if (day === 6 && timeInput.value > '16:30') {
      timeInput.setCustomValidity('Los sábados cerramos a las 17:00. Elige una hora anterior.');
    }
  }

  function showError(field) {
    const out = document.getElementById(`${field.id}-error`);
    const v = field.validity;
    let text = '';
    if (!v.valid) {
      const custom = messages[field.name] || {};
      const key = Object.keys(custom).find((k) => v[k]);
      text = key ? custom[key] : field.validationMessage;
    }
    if (out) out.textContent = text;
    field.setAttribute('aria-invalid', text ? 'true' : 'false');
    return text;
  }

  // Al corregir un campo se actualiza su mensaje al momento (no se valida mientras se escribe por primera vez)
  fields.forEach((field) => {
    const events = field.tagName === 'SELECT' ? ['change'] : ['input', 'change'];
    events.forEach((type) => field.addEventListener(type, () => {
      checkSchedule();
      if (field.getAttribute('aria-invalid') === 'true') showError(field);
      if (field === dateInput || field === timeInput) {
        if (dateInput.getAttribute('aria-invalid') === 'true') showError(dateInput);
        if (timeInput.getAttribute('aria-invalid') === 'true') showError(timeInput);
      }
    }));
    field.addEventListener('blur', () => { if (field.value) showError(field); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // nunca se envía: es una demostración
    checkSchedule();
    const invalid = fields.filter((f) => showError(f));

    status.classList.toggle('is-error', invalid.length > 0);
    if (invalid.length) {
      status.textContent = invalid.length === 1
        ? 'Revisa el campo marcado.'
        : `Revisa los ${invalid.length} campos marcados.`;
      invalid[0].focus();
      return;
    }

    const name = form.elements.nombre.value.trim();
    status.textContent = `Gracias, ${name}. Esto es una demostración: no se ha enviado ni guardado ningún dato.`;
    form.reset();
    fields.forEach((f) => f.setAttribute('aria-invalid', 'false'));
  });
})();
