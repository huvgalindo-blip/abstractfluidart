// ============================================================
// obras-admin.js — Listado de obras en el panel de admin
// Carga, filtra, y permite acciones rápidas (destacar, publicar, borrar).
// ============================================================

import {
  adminApi,
  requireSession,
  euros,
  toast,
  confirmAction,
} from './admin-api.js';

// ---------- 1) Comprobar sesión ----------
if (!(await requireSession())) throw new Error('Sin sesión');

// ---------- 2) Logout ----------
document.getElementById('logout').onclick = async () => {
  await adminApi.logout();
  location.href = '/admin/index.html';
};

// ---------- 3) Estado en memoria ----------
let allArtworks = [];      // todas las obras cargadas
let allCategories = [];    // todas las categorías cargadas
let filters = {
  q: '',
  category: '',
  status: '',
};

// ---------- 4) Carga inicial ----------
try {
  [allArtworks, allCategories] = await Promise.all([
    adminApi.getArtworks(),
    adminApi.getCategories(),
  ]);

  // Rellena el desplegable de categorías
  const catSelect = document.getElementById('filter-category');
  allCategories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });

  // Renderiza la tabla
  render();
} catch (err) {
  console.error(err);
  document.getElementById('tabla-container').innerHTML =
    `<div class="empty">Error cargando obras: ${err.message}</div>`;
  toast('Error cargando obras', 'err');
}

// ---------- 5) Eventos de los filtros ----------
document.getElementById('search').addEventListener('input', (e) => {
  filters.q = e.target.value.toLowerCase().trim();
  render();
});
document.getElementById('filter-category').addEventListener('change', (e) => {
  filters.category = e.target.value;
  render();
});
document.getElementById('filter-status').addEventListener('change', (e) => {
  filters.status = e.target.value;
  render();
});

// ---------- 6) Renderizado de la tabla ----------
function render() {
  const container = document.getElementById('tabla-container');
  const filtered = applyFilters(allArtworks);

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">No hay obras que coincidan con los filtros.</div>`;
    return;
  }

  const rows = filtered.map(a => {
    // Badges de estado
    const badges = [];
    if (a.is_featured) badges.push('<span class="badge badge--featured">Destacada</span>');
    if (!a.is_published) badges.push('<span class="badge badge--draft">No publicada</span>');
    if (!a.is_available) badges.push('<span class="badge badge--unavailable">No disponible</span>');

    // Botón destacar: activo si ya lo está
    const featuredBtn = `
      <button class="icon-btn ${a.is_featured ? 'is-active' : ''}"
              title="${a.is_featured ? 'Quitar destacada' : 'Destacar'}"
              data-action="featured" data-id="${a.id}">
        ⭐
      </button>`;

    // Botón publicar/despublicar
    const publishBtn = `
      <button class="icon-btn ${a.is_published ? '' : 'is-active'}"
              title="${a.is_published ? 'Despublicar' : 'Publicar'}"
              data-action="publish" data-id="${a.id}">
        👁️
      </button>`;

    return `
      <tr>
        <td><img src="${a.image_url}" alt="${a.title}" loading="lazy"></td>
        <td>
          <div class="artwork-title">${escapeHtml(a.title)}</div>
          <div class="artwork-meta">${escapeHtml(a.technique)} · ${escapeHtml(a.dimensions)}</div>
          ${badges.length ? `<div style="margin-top:.3rem">${badges.join('')}</div>` : ''}
        </td>
        <td>${a.category_name || '—'}</td>
        <td><strong>${euros(a.price_cents)}</strong></td>
        <td>
          <div class="artwork-actions">
            ${featuredBtn}
            ${publishBtn}
            <a href="/admin/obras-editar.html?id=${a.id}" class="icon-btn" title="Editar">✏️</a>
            <button class="icon-btn" data-action="delete" data-id="${a.id}" title="Borrar">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="artwork-table">
      <thead>
        <tr>
          <th style="width:80px"></th>
          <th>Obra</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th style="width:200px">Acciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  // Engancha los listeners de las acciones
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action, +btn.dataset.id));
  });
}

// ---------- 7) Filtros ----------
function applyFilters(list) {
  return list.filter(a => {
    if (filters.q) {
      const haystack = `${a.title} ${a.technique} ${a.dimensions}`.toLowerCase();
      if (!haystack.includes(filters.q)) return false;
    }
    if (filters.category && String(a.category_id) !== String(filters.category)) return false;
    if (filters.status === 'published' && !a.is_published) return false;
    if (filters.status === 'draft' && a.is_published) return false;
    if (filters.status === 'featured' && !a.is_featured) return false;
    return true;
  });
}

// ---------- 8) Acciones por fila ----------
async function handleAction(action, id) {
  const art = allArtworks.find(a => a.id === id);
  if (!art) return;

  try {
    if (action === 'featured') {
      const next = !art.is_featured;
      await adminApi.updateArtwork(id, { is_featured: next });
      art.is_featured = next ? 1 : 0;
      toast(next ? 'Obra destacada' : 'Obra ya no destacada');
      render();
    }

    if (action === 'publish') {
      const next = !art.is_published;
      await adminApi.updateArtwork(id, { is_published: next });
      art.is_published = next ? 1 : 0;
      toast(next ? 'Obra publicada' : 'Obra despublicada');
      render();
    }

    if (action === 'delete') {
      const ok = await confirmAction(
        `¿Seguro que quieres borrar "${art.title}"?\n\nEsta acción no se puede deshacer.`
      );
      if (!ok) return;

      await adminApi.deleteArtwork(id);
      allArtworks = allArtworks.filter(a => a.id !== id);
      toast('Obra borrada');
      render();
    }
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
}

// ---------- 9) Utilidad: escapar HTML ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
