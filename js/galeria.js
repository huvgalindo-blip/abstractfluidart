// ============================================================
// galeria.js — Catálogo completo
// ============================================================

import { api } from './api.js';
import { renderHeader, renderFooter } from './layout.js';

renderHeader();
renderFooter();

try {
  const obras = await api.getArtworks();
  const grid = document.getElementById('galeria-grid');

  if (!obras.length) {
    grid.innerHTML = '<p>No hay obras disponibles por el momento.</p>';
  } else {
    grid.innerHTML = obras.map(o => `
      <a class="card" href="/obra.html?slug=${o.slug}">
        <img src="${o.image_url}" alt="${o.title}" loading="lazy">
        <h3>${o.title}</h3>
        <p class="meta">${o.technique} · ${o.dimensions}</p>
        <p class="price">${(o.price_cents / 100).toFixed(2)} €</p>
      </a>
    `).join('');
  }
} catch (e) {
  console.error('Error cargando galería:', e);
  document.getElementById('galeria-grid').innerHTML = '<p>Error al cargar la galería.</p>';
}
