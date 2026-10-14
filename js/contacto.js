// ============================================================
// contacto.js — Formulario de contacto
// Envía el mensaje al backend y muestra confirmación.
// ============================================================

import { api } from './api.js';
import { renderHeader, renderFooter } from './layout.js';

renderHeader();
renderFooter();

// ---------- Envío del formulario ----------
const form = document.getElementById('contact-form');
if (form) {
  form.onsubmit = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    const btn = form.querySelector('button');
    const original = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    try {
      await api.contact(data);
      form.outerHTML = `
        <p style="color: var(--color-accent); font-weight: 600; margin-top: 2rem;">
          ¡Gracias! Te responderemos lo antes posible.
        </p>`;
    } catch (err) {
      alert('Error al enviar: ' + err.message);
      btn.disabled = false;
      btn.textContent = original;
    }
  };
}
