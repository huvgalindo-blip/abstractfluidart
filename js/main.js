// ============================================================
// main.js — Página de inicio
// ============================================================

import { api } from './api.js';
import { renderHeader, renderFooter } from './layout.js';

renderHeader();
renderFooter();

// --- Obras destacadas ---
try {
  const obras = await api.getFeatured();
  const grid = document.getElementById('featured-grid');

  if (!obras.length) {
    grid.innerHTML = '<p>Aún no hay obras publicadas.</p>';
  } else {
    grid.innerHTML = obras.map(o => `
      <a class="card" href="/obra.html?slug=${o.slug}">
        <img src="${o.image_url}" alt="${o.title}" loading="lazy">
        <h3>${o.title}</h3>
        <p class="meta">${o.technique} · ${o.dimensions}</p>
        <p class="price">${(o.price_cents / 100).toFixed(2)} €</p>
      </a>
    `).join('');

    // Imagen del hero = primera obra destacada
    if (obras[0]) {
      const hero = document.getElementById('hero-image');
      if (hero) hero.style.backgroundImage = `url('${obras[0].image_url}')`;
    }
  }
} catch (e) {
  console.error('Error cargando destacadas:', e);
}

// --- Newsletter ---
const nf = document.getElementById('newsletter-form');
if (nf) {
  nf.onsubmit = async (e) => {
    e.preventDefault();
    const email = nf.querySelector('input').value;
    try {
      await api.newsletter(email);
      nf.innerHTML = '<p style="color:var(--color-accent);font-weight:600">¡Gracias! Te avisaremos de las nuevas obras.</p>';
    } catch {
      alert('No se pudo suscribir, inténtalo más tarde.');
    }
  };
}
