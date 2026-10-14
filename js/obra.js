// ============================================================
// obra.js — Ficha individual de cada obra
// ============================================================

import { api } from './api.js';
import { cart } from './cart.js';
import { renderHeader, renderFooter } from './layout.js';

renderHeader();
renderFooter();

// ---------- Comprobación de slug ----------
const slug = new URLSearchParams(location.search).get('slug');
if (!slug) {
  location.href = '/galeria.html';
}

// ---------- Carga de la obra ----------
try {
  const o = await api.getArtwork(slug);

  // Título de la pestaña dinámico
  document.title = `${o.title} — AbstractFluidArt`;

  // Render de la ficha completa
  document.getElementById('obra').innerHTML = `
    <div class="obra__img">
      <img src="${o.image_url}" alt="${o.title}">
    </div>
    <div class="obra__info">
      <h1>${o.title}</h1>
      <p class="obra__meta">
        ${o.technique} · ${o.dimensions}${o.year_month ? ' · ' + o.year_month : ''}
      </p>
      ${o.poetic_phrase ? `<blockquote class="obra__phrase">${o.poetic_phrase}</blockquote>` : ''}
      ${o.description ? `<p>${o.description}</p>` : ''}
      <p class="obra__price">${(o.price_cents / 100).toFixed(2)} €</p>
      <button class="btn btn--primary" id="add-to-cart">
        ${o.stock > 0 ? 'Añadir al carrito' : 'Agotada'}
      </button>
      <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--color-muted);">
        Envío en 3-5 días laborables · Embalaje rígido profesional
      </p>
    </div>`;

  // ---------- Botón "Añadir al carrito" ----------
  const btn = document.getElementById('add-to-cart');
  if (o.stock > 0) {
    btn.onclick = () => {
      cart.add(o);
      btn.textContent = '✓ Añadida';
      setTimeout(() => (btn.textContent = 'Añadir al carrito'), 1500);
    };
  } else {
    btn.disabled = true;
    btn.style.opacity = 0.5;
  }
} catch (err) {
  console.error('Error cargando obra:', err);
  document.getElementById('obra').innerHTML = `
    <p>Obra no encontrada. <a href="/galeria.html">Volver a la galería</a></p>`;
}
