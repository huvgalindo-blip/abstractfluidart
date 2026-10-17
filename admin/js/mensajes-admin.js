// ============================================================
// mensajes-admin.js — Bandeja de mensajes del formulario de contacto
// ============================================================

import {
  adminApi,
  requireSession,
  formatDate,
  toast,
} from './admin-api.js';

// ---------- 1) Sesión ----------
if (!(await requireSession())) throw new Error('Sin sesión');

// ---------- 2) Logout ----------
document.getElementById('logout').onclick = async () => {
  await adminApi.logout();
  location.href = '/admin/index.html';
};

// ---------- 3) Estado ----------
let allMessages = [];
let currentFilter = '';
let openId = null;

const lista = document.getElementById('lista');

// ---------- 4) Carga inicial ----------
try {
  allMessages = await adminApi.getMessages();
  render();
} catch (err) {
  console.error(err);
  lista.innerHTML = `<div class="empty">Error cargando mensajes: ${err.message}</div>`;
  toast('Error cargando mensajes', 'err');
}

// ---------- 5) Filtros ----------
document.querySelectorAll('#filters .filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    openId = null;
    render();
  };
});

// ---------- 6) Render ----------
function render() {
  const filtered = allMessages.filter(m => {
    if (currentFilter === 'unread') return !m.is_read;
    if (currentFilter === 'read') return !!m.is_read;
    return true;
  });

  if (!filtered.length) {
    lista.innerHTML = `<div class="empty">
      ${currentFilter === 'unread'
        ? 'No hay mensajes sin leer. 🎉'
        : currentFilter === 'read'
          ? 'No hay mensajes leídos aún.'
          : 'Aún no hay mensajes recibidos.'}
    </div>`;
    return;
  }

  lista.innerHTML = filtered.map(m => {
    const isOpen = openId === m.id;
    const unread = !m.is_read;

    return `
      <div class="msg-card ${unread ? 'unread' : ''}" data-id="${m.id}">
        <div class="msg-head" data-toggle="${m.id}">
          <div>
            <h3>${escapeHtml(m.subject || '(Sin asunto)')}</h3>
            <div class="meta">
              <strong>${escapeHtml(m.name || 'Anónimo')}</strong>
              · ${escapeHtml(m.email)}
            </div>
          </div>
          <div class="date">${formatDate(m.created_at)}</div>
        </div>

        ${isOpen ? `
          <div class="msg-body">${escapeHtml(m.body)}</div>

          <div class="msg-actions">
            <a href="mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Tu mensaje en AbstractFluidArt'))}">
              ✉️ Responder por email
            </a>
            <button data-toggle="${m.id}">
              ${isOpen ? 'Cerrar' : 'Abrir'}
            </button>
          </div>
        ` : ''}
      </div>`;
  }).join('');

  // Listeners
  lista.querySelectorAll('[data-toggle]').forEach(el => {
    el.onclick = async (e) => {
      e.stopPropagation();
      const id = +el.dataset.toggle;
      const msg = allMessages.find(m => m.id === id);
      if (!msg) return;

      const wasClosed = openId !== id;
      openId = wasClosed ? id : null;

      // Si se abre y no está leído, marcar como leído
      if (wasClosed && !msg.is_read) {
        try {
          await adminApi.markMessageRead(id);
          msg.is_read = 1;
        } catch (err) {
          console.error(err);
          toast('No se pudo marcar como leído', 'err');
        }
      }

      render();
    };
  });
}

// ---------- 7) Utilidad ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
