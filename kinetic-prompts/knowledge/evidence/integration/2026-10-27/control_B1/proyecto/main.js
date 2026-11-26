'use strict';

// Menú móvil
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav-principal');

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
}

toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

// Revelados al hacer scroll (una sola vez por elemento)
const reveals = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  // Escalonado ligero dentro de cada grupo (máx. 4 pasos)
  document.querySelectorAll('.menu, .gallery, .quotes').forEach((group) => {
    group.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${(i % 4) * 0.08}s`));
  });
  reveals.forEach((el) => io.observe(el));
}

// Formulario de reserva: solo validación local, no se envía nada
const form = document.getElementById('form-reserva');
const status = document.getElementById('estado');
const fecha = document.getElementById('fecha');

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
fecha.min = today.toISOString().slice(0, 10);

const rules = {
  nombre: (v) => v.trim().length > 1,
  telefono: (v) => /^\d{9}$/.test(v.replace(/[\s.-]/g, '').replace(/^\+34/, '')),
  servicio: (v) => v !== '',
  fecha: (v) => v !== '' && v >= fecha.min,
  hora: (v) => v !== '',
};

function validateField(name) {
  const input = form.elements[name];
  const ok = rules[name](input.value);
  input.setAttribute('aria-invalid', String(!ok));
  const msg = document.getElementById(`err-${name}`);
  msg.hidden = ok;
  if (ok) input.removeAttribute('aria-describedby'); else input.setAttribute('aria-describedby', msg.id);
  return ok;
}

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener('blur', () => validateField(name));
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(name); });
});

form.addEventListener('submit', (e) => {
  e.preventDefault(); // Prototipo: ningún dato sale de la página
  const results = Object.keys(rules).map((n) => [n, validateField(n)]);
  const firstBad = results.find(([, ok]) => !ok);
  if (firstBad) {
    status.textContent = 'Revisa los campos marcados.';
    form.elements[firstBad[0]].focus();
    return;
  }
  status.textContent = 'Reserva simulada: es un prototipo y no se ha enviado ni guardado ningún dato.';
  form.reset();
  Object.keys(rules).forEach((n) => form.elements[n].removeAttribute('aria-invalid'));
});
