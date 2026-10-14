// ============================================================
// categories-seed.js — Categorías iniciales de la galería
// Estas categorías se cargan en la BD la primera vez.
// Son editables desde el panel de administración.
// ============================================================

import { db } from './db.js';

const CATEGORIES = [
  {
    slug: 'obra-original',
    name: 'Obra original',
    description: 'Piezas únicas pintadas a mano por Cristina Pacheco.',
    sort_order: 1,
  },
  {
    slug: 'monotipo',
    name: 'Monotipo',
    description: 'Obra gráfica única obtenida por impresión directa.',
    sort_order: 2,
  },
  {
    slug: 'lamina-impresa',
    name: 'Lámina impresa',
    description: 'Reproducción de alta calidad. Próximamente disponible.',
    sort_order: 3,
  },
  {
    slug: 'sin-categoria',
    name: 'Sin categoría',
    description: 'Obras pendientes de clasificar.',
    sort_order: 99,
  },
];

// Inserta solo las categorías que aún no existen (idempotente).
const insert = db.prepare(`
  INSERT INTO categories (slug, name, description, sort_order, is_visible)
  VALUES (@slug, @name, @description, @sort_order, 1)
  ON CONFLICT(slug) DO NOTHING
`);

const run = db.transaction(() => {
  for (const c of CATEGORIES) insert.run(c);
});

run();

const total = db.prepare('SELECT COUNT(*) c FROM categories').get().c;
console.log(`✅ Categorías: ${total} en la base de datos.`);
