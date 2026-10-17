// ============================================================
// artista-admin.js — Editor de bio y statement de la artista
// ============================================================

import {
  adminApi,
  requireSession,
  toast,
} from './admin-api.js';

// ---------- 1) Sesión ----------
if (!(await requireSession())) throw new Error('Sin sesión');

// ---------- 2) Logout ----------
document.getElementById('logout').onclick = async () => {
  await adminApi.logout();
  location.href = '/admin/index.html';
};

// ---------- 3) Referencias al DOM ----------
const form           = document.getElementById('artista-form');
const nameEl         = document.getElementById('name');
const photoEl        = document.getElementById('photo_url');
const bioEl          = document.getElementById('bio');
const statementEl    = document.getElementById('statement');
const instagramEl    = document.getElementById('instagram');
const whatsappEl     = document.getElementById('whatsapp');
const emailEl        = document.getElementById('email');
const saveBtn        = document.getElementById('save-btn');

const photoPreview    = document.getElementById('photo-preview');
const namePreview     = document.getElementById('name-preview');
const statementPreview = document.getElementById('statement-preview');

// ---------- 4) Carga inicial ----------
try {
  const res = await fetch('/api/artist');
  const artist = res.ok ? await res.json() : null;

  if (artist) {
    nameEl.value        = artist.name || '';
    photoEl.value       = artist.photo_url || '';
    bioEl.value         = artist.bio || '';
    statementEl.value   = artist.statement || '';
    instagramEl.value   = artist.instagram || '';
    whatsappEl.value    = artist.whatsapp || '';
    emailEl.value       = artist.email || '';
  }

  updatePreview();
} catch (err) {
  console.error('Error cargando artista:', err);
  toast('Error cargando datos de la artista', 'err');
}

// ---------- 5) Vista previa en vivo ----------
nameEl.addEventListener('input', updatePreview);
statementEl.addEventListener('input', updatePreview);
photoEl.addEventListener('input', updatePreview);

function updatePreview() {
  // Nombre
  namePreview.textContent = nameEl.value.trim() || '—';

  // Foto circular
  const photo = photoEl.value.trim();
  if (photo) {
    photoPreview.innerHTML = `
      <img src="${photo}"
           alt="Foto de perfil"
           onerror="this.parentNode.innerHTML='<div class=&quot;empty-img&quot;>Foto no encontrada</div>'">
    `;
  } else {
    photoPreview.innerHTML = '<div class="empty-img">Sin foto</div>';
  }

  // Statement
  const st = statementEl.value.trim();
  statementPreview.textContent = st
    ? (st.length > 240 ? st.slice(0, 240) + '…' : st)
    : 'El statement aparecerá aquí.';
}

// ---------- 6) Envío del formulario ----------
form.onsubmit = async (e) => {
  e.preventDefault();

  const data = {
    name:      nameEl.value.trim(),
    photo_url: photoEl.value.trim() || null,
    bio:       bioEl.value.trim() || null,
    statement: statementEl.value.trim() || null,
    instagram: instagramEl.value.trim() || null,
    whatsapp:  whatsappEl.value.trim() || null,
    email:     emailEl.value.trim() || null,
  };

  if (!data.name) {
    toast('El nombre es obligatorio', 'err');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    const res = await fetch('/api/admin/artist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.status === 401) {
      location.href = '/admin/index.html';
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error guardando');
    }

    toast('Datos de la artista actualizados');
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar cambios';
  }
};
