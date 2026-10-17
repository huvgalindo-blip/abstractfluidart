// ============================================================
// obras-editar.js — Formulario de edición / creación de obra
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

// ---------- 3) Detectar si es "editar" o "nueva" ----------
const params = new URLSearchParams(location.search);
const artworkId = params.get('id');
const isEdit = !!artworkId;

// Cambia el título de la página
document.getElementById('page-title').textContent =
  isEdit ? 'Editar obra' : 'Nueva obra';

// ---------- 4) Referencias al DOM ----------
const form = document.getElementById('obra-form');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const categoryEl = document.getElementById('category_id');
const techniqueEl = document.getElementById('technique');
const dimensionsEl = document.getElementById('dimensions');
const yearMonthEl = document.getElementById('year_month');
const priceEl = document.getElementById('price');
const stockEl = document.getElementById('stock');
const imageFileEl = document.getElementById('image_file');
const descriptionEl = document.getElementById('description');
const poeticPhraseEl = document.getElementById('poetic_phrase');
const storyEl = document.getElementById('story');
const isFeaturedEl = document.getElementById('is_featured');
const isPublishedEl = document.getElementById('is_published');
const isAvailableEl = document.getElementById('is_available');
const saveBtn = document.getElementById('save-btn');
const previewContainer = document.getElementById('preview-container');

// ---------- 5) Cargar categorías ----------
try {
  const categories = await adminApi.getCategories();
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    categoryEl.appendChild(opt);
  });
} catch (err) {
  console.error('Error cargando categorías:', err);
  toast('Error cargando categorías', 'err');
}

// ---------- 6) Vista previa de la imagen en vivo ----------
imageFileEl.addEventListener('input', () => {
  const file = imageFileEl.value.trim();
  if (!file) {
    previewContainer.innerHTML = '<div class="empty-img">Sin imagen</div>';
    return;
  }
  previewContainer.innerHTML = `
    <img src="/assets/img/${file}"
         alt="Vista previa"
         onerror="this.parentNode.innerHTML='<div class=&quot;empty-img&quot;>Imagen no encontrada</div>'">
  `;
});

// ---------- 7) Si es editar → cargar datos de la obra ----------
if (isEdit) {
  try {
    // Pedimos la lista completa y buscamos por id.
    // (El endpoint /api/artworks/:slug también acepta id, pero
    //  preferimos la lista porque ya trae la categoría asignada.)
    const list = await adminApi.getArtworks();
    const art = list.find(a => String(a.id) === String(artworkId));

    if (!art) {
      toast('Obra no encontrada', 'err');
      setTimeout(() => (location.href = '/admin/obras.html'), 1500);
      throw new Error('Obra no encontrada');
    }

    document.title = `Editar: ${art.title} · Admin`;

    // Rellenar campos
    titleEl.value = art.title || '';
    subtitleEl.value = art.subtitle || '';
    categoryEl.value = art.category_id || '';
    techniqueEl.value = art.technique || '';
    dimensionsEl.value = art.dimensions || '';
    yearMonthEl.value = art.year_month || '';
    priceEl.value = (art.price_cents / 100).toFixed(2);
    stockEl.value = art.stock ?? 1;
    imageFileEl.value = (art.image_url || '').replace('/assets/img/', '');
    descriptionEl.value = art.description || '';
    poeticPhraseEl.value = art.poetic_phrase || '';
    storyEl.value = art.story || '';
    isFeaturedEl.checked = !!art.is_featured;
    isPublishedEl.checked = !!art.is_published;
    isAvailableEl.checked = !!art.is_available;

    // Disparar la vista previa
    imageFileEl.dispatchEvent(new Event('input'));
  } catch (err) {
    console.error('Error cargando obra:', err);
  }
}

// ---------- 8) Envío del formulario ----------
form.onsubmit = async (e) => {
  e.preventDefault();

  // Validación mínima
  if (!titleEl.value.trim()) return toast('El título es obligatorio', 'err');
  if (!techniqueEl.value.trim()) return toast('La técnica es obligatoria', 'err');
  if (!dimensionsEl.value.trim()) return toast('Las dimensiones son obligatorias', 'err');
  if (!priceEl.value || isNaN(+priceEl.value)) return toast('El precio no es válido', 'err');
  if (!imageFileEl.value.trim()) return toast('El nombre de archivo es obligatorio', 'err');

  // Construir payload
  const payload = {
    title: titleEl.value.trim(),
    subtitle: subtitleEl.value.trim() || null,
    category_id: categoryEl.value ? +categoryEl.value : null,
    technique: techniqueEl.value.trim(),
    dimensions: dimensionsEl.value.trim(),
    year_month: yearMonthEl.value.trim() || null,
    price_cents: Math.round(+priceEl.value * 100),
    stock: +stockEl.value || 1,
    image_url: '/assets/img/' + imageFileEl.value.trim(),
    description: descriptionEl.value.trim() || null,
    poetic_phrase: poeticPhraseEl.value.trim() || null,
    story: storyEl.value.trim() || null,
    is_featured: isFeaturedEl.checked,
    is_published: isPublishedEl.checked,
    is_available: isAvailableEl.checked,
  };

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    if (isEdit) {
      await adminApi.updateArtwork(+artworkId, payload);
      toast('Obra actualizada');
    } else {
      await adminApi.createArtwork(payload);
      toast('Obra creada');
    }

    // Redirige al listado
    setTimeout(() => (location.href = '/admin/obras.html'), 600);
  } catch (err) {
    console.error(err);
    toast('Error: ' + err.message, 'err');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
  }
};
