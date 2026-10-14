// ============================================================
// sobre.js — Página "Sobre Cristina"
// Carga la bio y statement desde el backend.
// ============================================================

import { renderHeader, renderFooter } from './layout.js';

renderHeader();
renderFooter();

// ---------- Carga de datos desde la API ----------
try {
  const res = await fetch('/api/artist');
  const artist = res.ok ? await res.json() : null;

  if (artist) {
    document.getElementById('bio').textContent = artist.bio || '';
    document.getElementById('statement').textContent = artist.statement || '';

    if (artist.instagram) {
      document.getElementById('link-instagram').href = artist.instagram;
    }
    if (artist.whatsapp) {
      // Quita espacios, + y guiones para el link de WhatsApp
      const phone = artist.whatsapp.replace(/[^0-9]/g, '');
      document.getElementById('link-whatsapp').href = `https://wa.me/${phone}`;
    }
  }
} catch (err) {
  console.error('Error cargando datos de la artista:', err);
}
