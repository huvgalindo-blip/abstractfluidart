// ============================================================
// categorias-admin.js — CRUD de categorías
// ============================================================

import {
  adminApi,
  requireSession,
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

// ---------- 3) Referencias al DOM ----------
const form       = document.getElementById('cat-form');
const formTitle  = document.getElementById('cat-form-title');
const idEl       = document.getElementById('cat-id');
const nameEl     = document.getElementById('cat-name');
const slugEl     = document.getElementById('cat-slug');
const descEl     = document.getElementById('cat-description');
const sortEl     = document.getElementById('cat-sort');
const visibleEl  = document.getElementById('cat-visible');
const saveBtn    = document.getElementById('btn-save');
const cancelBtn  = document.getElementById('btn-cancel');
const newBtn     = document.getElementById('btn-new');
const container  = document.getElementById('tabla-container');

let allCategories = [];
let allArtworks   = [];

// ---------- 4) Carga inicial ----------
async function loadAll() {
  try {
    [allCategories, allArtworks] = await Promise.all([
      adminApi.getCategories(),
      adminApi.getArtworks(),
    ]);
    render();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty">Error cargando: ${err.message}</div>`;
    toast('Error cargando categorías', 'err');
  }
}

// ---------- 5) Render de la tabla ----------
function render() {
  if (!allCategories.length) {
    container.innerHTML = `<div class="empty">Aún no hay categorías. Pulsa "+ Nueva categoría".</div>`;
    return;
  }

  const counts = {};
  allArtworks.forEach(a => {
    if (a.category_id) counts[a.category_id] = (counts[a.category_id] || 0) + 1;
  });

  container.innerHTML = `
    <table class="cat-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Slug</th>
          <th>Descripción</th>
          <th style="width:90px">Obras</th>
          <th style="width:130px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${allCategories.map(c => `
          <tr>
            <td>
              <strong>${escapeHtml(c.name)}</strong>
              ${c.is_visible ? '' : ' <span style="font-size:.7rem;color:#6b7280;background:#f3f4f6;padding:.1rem .4rem;border-radius:4px;margin-left:.4rem">OCULTA</span>'}
            </td>
            <td><code>${escapeHtml(c.slug)}</code></td>
            <td style="color:var(--color-muted);font-size:.85rem">${escapeHtml(c.description || '—')}</td>
            <td><span class="count-pill">${counts[c.id] || 0}</span></td>
            <td>
              <div class="cat-actions">
                <button class="icon-btn" data-edit="${c.id}" title="Editar">✏️</button>
                <button class="icon-btn" data-delete="${c.id}" title="Borrar">🗑️</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  // Listeners de acciones
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => openEdit(+btn.dataset.edit);
  });
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => handleDelete(+btn.dataset.delete);
  });
}

// ---------- 6) Abrir formulario ----------
function openForm() {
  form.classList.add('is-open');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeForm() {
  form.classList.remove('is-open');
  form.reset();
  idEl.value = '';
}

function openNew() {
  formTitle.textContent = 'Nueva categoría';
  idEl.value = '';
  nameEl.value = '';
  slugEl.value = '';
  descEl.value = '';
  sortEl.value = '0';
  visibleEl.checked = true;
  openForm();
  nameEl.focus();
}

function openEdit(id) {
  const c = allCategories.find(x => x.id === id);
  if (!c) return;

  formTitle.textContent = `Editar "${c.name}"`;
  idEl.value = c.id;
  nameEl.value = c.name || '';
  slugEl.value = c.slug || '';
  descEl.value = c.description || '';
  sortEl.value = c.sort_order ?? 0;
  visibleEl.checked = !!c.is_visible;
  openForm();
  nameEl.focus();
}

// ---------- 7) Auto-generar slug desde el nombre ----------
nameEl.addEventListener('input', () => {
  // Solo genera el slug si el campo está vacío o el usuario no lo ha tocado
  if (idEl.value) return; // en edición no auto-generamos
  if (slugEl.value && slugEl.dataset.touched === '1') return;

  slugEl.value = nameEl.value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
});

slugEl.addEventListener('input', () => {
  slugEl.dataset.touched = '1';
});

// ---------- 8) Enviar formulario (crear o actualizar) ----------
form.onsubmit = async (e) => {
  e.preventDefault();

  const data = {
    name: nameEl.value.trim(),
    slug: slugEl.value.trim(),
    description: descEl.value.trim() || null,
    sort_order: +sortEl.value || 0,
    is_visible: visibleEl.checked,
  };

  if (!data.name || !data.slug) {
    toast('Nombre y slug son obligatorios', 'err');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    if (idEl.value) {
      await adminApi.updateCategory(+idEl.value, data);
      toast('Categoría actualizada');
    } else {
      await adminApi.createCategory(data);
      toast('Categoría creada');
    }

    closeForm();
    await loadAll();
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
  }
};

// ---------- 9) Borrar categoría ----------
async function handleDelete(id) {
  const c = allCategories.find(x => x.id === id);
  if (!c) return;

  const works = allArtworks.filter(a => a.category_id === id).length;
  const ok = await confirmAction(
    `¿Borrar la categoría "${c.name}"?\n\n` +
    (works > 0
      ? `Hay ${works} obra(s) en esta categoría. Se quedarán sin categoría (no se borrarán).`
      : `Esta categoría no tiene obras.`)
  );
  if (!ok) return;

  try {
    await adminApi.deleteCategory(id);
    toast('Categoría borrada');
    await loadAll();
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  }
}

// ---------- 10) Listeners de botones ----------
newBtn.onclick = openNew;
cancelBtn.onclick = closeForm;

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

// ---------- 12) Arranque ----------
await loadAll();
