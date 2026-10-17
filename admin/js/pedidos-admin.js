// ============================================================
// pedidos-admin.js — Gestión de pedidos en el admin
// ============================================================

import {
  adminApi,
  requireSession,
  euros,
  formatDate,
  toast,
  confirmAction,
} from './admin-api.js';

// ---------- 1) Sesión ----------
if (!(await requireSession())) throw new Error('Sin sesión');

// ---------- 2) Logout ----------
document.getElementById('logout').onclick = async () => {
  await adminApi.logout();
  location.href = '/admin/index.html';
};

// ---------- 3) Estado ----------
let allOrders = [];
let allArtworks = [];       // para cruzar order_items → título/imagen
let currentStatus = '';
let openOrderId = null;

const container = document.getElementById('tabla-container');

// ---------- 4) Carga inicial ----------
try {
  [allOrders, allArtworks] = await Promise.all([
    adminApi.getOrders(),
    adminApi.getArtworks(),
  ]);
  render();
} catch (err) {
  console.error(err);
  container.innerHTML = `<div class="empty">Error cargando pedidos: ${err.message}</div>`;
  toast('Error cargando pedidos', 'err');
}

// ---------- 5) Filtros de estado ----------
document.querySelectorAll('#filters .filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#filters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.dataset.status;
    openOrderId = null;
    render();
  };
});

// ---------- 6) Render principal ----------
function render() {
  const filtered = currentStatus
    ? allOrders.filter(o => o.status === currentStatus)
    : allOrders;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">
      ${currentStatus
        ? `No hay pedidos con estado "${currentStatus}".`
        : 'Aún no hay pedidos registrados.'}
    </div>`;
    return;
  }

  container.innerHTML = `
    <table class="orders-table">
      <thead>
        <tr>
          <th>Referencia</th>
          <th>Cliente</th>
          <th>Método</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(o => renderRow(o) + renderDetail(o)).join('')}
      </tbody>
    </table>`;

  // Listeners
  container.querySelectorAll('tr[data-order-id]').forEach(tr => {
    tr.onclick = (e) => {
      // No expandir si se ha pulsado un botón dentro del detalle
      if (e.target.closest('.order-detail')) return;

      const id = +tr.dataset.orderId;
      openOrderId = (openOrderId === id) ? null : id;
      render();
    };
  });

  // Listeners de botones de cambio de estado
  container.querySelectorAll('[data-set-status]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = +btn.dataset.orderId;
      const status = btn.dataset.setStatus;

      const ok = await confirmAction(
        `Cambiar el pedido a "${statusLabel(status)}". ¿Confirmas?`
      );
      if (!ok) return;

      btn.disabled = true;
      btn.textContent = '…';

      try {
        await adminApi.updateOrder(id, { status });
        const order = allOrders.find(x => x.id === id);
        if (order) order.status = status;
        toast('Estado actualizado');
        render();
      } catch (err) {
        console.error(err);
        toast('Error: ' + err.message, 'err');
      }
    };
  });
}

// ---------- 7) Fila de la tabla ----------
function renderRow(o) {
  return `
    <tr data-order-id="${o.id}">
      <td><strong>${o.reference}</strong></td>
      <td>
        ${escapeHtml(o.customer_name || '—')}
        <br><span style="color:var(--color-muted);font-size:.8rem">${escapeHtml(o.customer_email || '')}</span>
      </td>
      <td style="text-transform:capitalize">${o.payment_method || '—'}</td>
      <td><strong>${euros(o.total_cents)}</strong></td>
      <td><span class="status-pill status-${o.status}">${statusLabel(o.status)}</span></td>
      <td style="color:var(--color-muted);font-size:.85rem">${formatDate(o.created_at)}</td>
    </tr>
    ${openOrderId === o.id ? '' : ''}
  `;
}

// ---------- 8) Detalle (expandible) ----------
function renderDetail(o) {
  if (openOrderId !== o.id) return '';

  // Cruzar items con obras para obtener título e imagen
  const itemsHtml = (o.items || []).map(it => {
    const art = allArtworks.find(a => a.id === it.artwork_id);
    const title = art ? art.title : `Obra #${it.artwork_id}`;
    const img = art ? art.image_url : '';
    return `
      <li>
        <div style="display:flex;align-items:center;gap:0.7rem">
          ${img ? `<img src="${img}" alt="" style="width:36px;height:45px;object-fit:cover;border-radius:4px">` : ''}
          <span>${escapeHtml(title)} × ${it.quantity}</span>
        </div>
        <strong>${euros(it.unit_price_cents * it.quantity)}</strong>
      </li>`;
  }).join('');

  const possibleStates = nextStates(o.status);

  return `
    <tr data-order-id="${o.id}">
      <td colspan="6" style="padding: 0;">
        <div class="order-detail">
          <h4>Detalle del pedido ${o.reference}</h4>

          <div class="meta-grid">
            <div>
              <span>Método de pago</span>
              <strong style="text-transform:capitalize">${o.payment_method || '—'}</strong>
            </div>
            <div>
              <span>Dirección de envío</span>
              <strong>${escapeHtml(o.shipping_address || '—')}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>${euros(o.subtotal_cents)}</strong>
            </div>
            <div>
              <span>Envío</span>
              <strong>${o.shipping_cents === 0 ? 'Gratis' : euros(o.shipping_cents)}</strong>
            </div>
            ${o.notes ? `<div style="grid-column: 1 / -1">
              <span>Notas del cliente</span>
              <em>${escapeHtml(o.notes)}</em>
            </div>` : ''}
          </div>

          <h4 style="margin-top:1rem">Obras</h4>
          <ul class="items-list">${itemsHtml}</ul>

          ${possibleStates.length ? `
            <div class="status-actions">
              <strong style="align-self:center;margin-right:.5rem;font-size:.85rem;text-transform:uppercase;letter-spacing:.05em;color:var(--color-muted)">
                Cambiar a:
              </strong>
              ${possibleStates.map(s => `
                <button data-set-status="${s}" data-order-id="${o.id}">
                  ${statusLabel(s)}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </td>
    </tr>`;
}

// ---------- 9) Estados posibles ----------
function nextStates(current) {
  switch (current) {
    case 'pending':   return ['paid', 'cancelled'];
    case 'paid':      return ['shipped', 'cancelled'];
    case 'shipped':   return ['delivered'];
    case 'delivered': return [];
    case 'cancelled': return ['pending'];
    default:          return [];
  }
}

// ---------- 10) Etiquetas ----------
function statusLabel(s) {
  return {
    pending:   'Pendiente',
    paid:      'Pagado',
    shipped:   'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  }[s] || s;
}

// ---------- 11) Utilidad ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
