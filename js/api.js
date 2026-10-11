// ============================================================
// api.js — Capa de acceso al backend
// Todas las llamadas a /api/... pasan por aquí.
// Si el backend no responde, cae al fallback local (mock).
// ============================================================

const API_BASE = '/api';

// --- Datos de reserva mientras no hay backend desplegado ---
// Cuando Render esté activo, esto no se usará.
const MOCK_ARTWORKS = [
  {
    id: 1, slug: 'interrupcion-ii',
    title: 'Interrupción II',
    technique: 'Acuarela, tinta Parker y sal sobre papel algodón',
    dimensions: '42 x 30 cm', price_cents: 18000,
    image_url: '/assets/img/placeholder.svg',
    is_featured: 1,
  },
  {
    id: 2, slug: 'lengua-casa-ser',
    title: 'La lengua es la casa del ser',
    technique: 'Pigmentos tierra sobre papel algodón',
    dimensions: '42 x 30 cm', price_cents: 22000,
    image_url: '/assets/img/placeholder.svg',
    is_featured: 1,
  },
  {
    id: 3, slug: 'luciernagas',
    title: 'Supervivencia de las luciérnagas',
    technique: 'Acuarela, tinta Parker y lejía sobre papel algodón',
    dimensions: '42 x 30 cm', price_cents: 24000,
    image_url: '/assets/img/placeholder.svg',
    is_featured: 1,
  },
];

// --- Petición genérica ---
async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

// --- API pública ---
export const api = {
  getFeatured: async () => {
    try { return await request('/artworks?featured=1'); }
    catch { return MOCK_ARTWORKS.filter(o => o.is_featured); }
  },

  getArtworks: async (f = {}) => {
    try { return await request('/artworks?' + new URLSearchParams(f)); }
    catch { return MOCK_ARTWORKS; }
  },

  getArtwork: async (slug) => {
    try { return await request(`/artworks/${slug}`); }
    catch { return MOCK_ARTWORKS.find(o => o.slug === slug) || MOCK_ARTWORKS[0]; }
  },

  createOrder:  (data)  => request('/orders',    { method: 'POST', body: JSON.stringify(data) }),
  getOrder:     (id)    => request(`/orders/${id}`),
  paypalCreate: (data)  => request('/payments/paypal/create', { method: 'POST', body: JSON.stringify(data) }),
  publicPayInfo:()      => request('/payments/public'),
  contact:      (data)  => request('/contact',   { method: 'POST', body: JSON.stringify(data) }),
  newsletter:   (email) => request('/contact/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),
};
