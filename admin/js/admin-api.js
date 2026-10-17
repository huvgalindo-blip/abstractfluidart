// ============================================================
// admin-api.js — Cliente de la API para el panel de admin
// Centraliza fetch, sesión y errores.
// ============================================================

const BASE = '/api/admin';

// --- Wrapper de peticiones ---
async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // Si la sesión ha caducado, redirigimos al login
  if (res.status === 401) {
    if (!location.pathname.endsWith('/admin/index.html')) {
      location.href = '/admin/index.html';
    }
    throw new Error('Sesión caducada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}

// --- API de administración ---
export const adminApi = {
  // --- Sesión ---
  me:     () => fetch('/api/admin/me').then(r => r.json()),
  logout: () => fetch('/api/admin/logout', { method: 'POST' }).then(r => r.json()),

  // --- Dashboard ---
  stats: () => request('/stats'),

  // --- Obras ---
  getArtworks:      ()           => request('/artworks'),
  createArtwork:    (data)       => request('/artworks',          { method: 'POST',   body: JSON.stringify(data) }),
  updateArtwork:    (id, data)   => request(`/artworks/${id}`,    { method: 'PUT',    body: JSON.stringify(data) }),
  deleteArtwork:    (id)         => request(`/artworks/${id}`,    { method: 'DELETE' }),

  // --- Categorías ---
  getCategories:    ()           => request('/categories'),
  createCategory:   (data)       => request('/categories',        { method: 'POST',   body: JSON.stringify(data) }),
  updateCategory:   (id, data)   => request(`/categories/${id}`,  { method: 'PUT',    body: JSON.stringify(data) }),
  deleteCategory:   (id)         => request(`/categories/${id}`,  { method: 'DELETE' }),

  // --- Pedidos ---
  getOrders:        ()           => request('/orders'),
  updateOrder:      (id, data)   => request(`/orders/${id}`,      { method: 'PUT',    body: JSON.stringify(data) }),

  // --- Mensajes ---
  getMessages:      ()           => request('/messages'),
  markMessageRead:  (id)         => request(`/messages/${id}`,    { method: 'PUT' }),
};

// --- Utilidades de UI (para usar en todas las páginas) ---

// Muestra un aviso flotante arriba a la derecha
export function toast(message, kind = 'ok') {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999;
    padding: 0.9rem 1.4rem; border-radius: 10px;
    background: ${kind === 'ok' ? '#15803d' : '#b91c1c'};
    color: #fff; font-family: system-ui, sans-serif; font-weight: 600;
    font-size: 0.95rem; box-shadow: 0 8px 30px rgba(0,0,0,.2);
    animation: slideIn .3s ease;
  `;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

// Confirma una acción antes de ejecutarla (devuelve promesa boolean)
export function confirmAction(message) {
  return new Promise(resolve => {
    if (window.confirm(message)) resolve(true);
    else resolve(false);
  });
}

// Redirige al login si no hay sesión
export async function requireSession() {
  try {
    const me = await adminApi.me();
    if (!me.admin) {
      location.href = '/admin/index.html';
      return false;
    }
    return true;
  } catch (_) {
    location.href = '/admin/index.html';
    return false;
  }
}

// Formatea un precio en céntimos a euros
export function euros(cents) {
  return (cents / 100).toFixed(2) + ' €';
}

// Formatea una fecha ISO a "dd/mm/yyyy hh:mm"
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
