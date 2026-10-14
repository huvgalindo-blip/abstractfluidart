// ============================================================
// init-db.js — Inicializa la base de datos
// Crea las tablas si no existen y carga las categorías base.
// Se ejecuta en cada build de Render (idempotente).
// ============================================================

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'afa.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 1) Crear tablas
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);
console.log('✅ Esquema aplicado.');

// 2) Cargar categorías iniciales (idempotente: solo inserta las que no existan)
const CATEGORIES = [
  { slug: 'obra-original',  name: 'Obra original',  description: 'Piezas únicas pintadas a mano por Cristina Pacheco.',        sort_order: 1 },
  { slug: 'monotipo',       name: 'Monotipo',       description: 'Obra gráfica única obtenida por impresión directa.',          sort_order: 2 },
  { slug: 'lamina-impresa', name: 'Lámina impresa', description: 'Reproducción de alta calidad. Próximamente disponible.',      sort_order: 3 },
  { slug: 'sin-categoria',  name: 'Sin categoría',  description: 'Obras pendientes de clasificar.',                             sort_order: 99 },
];

const insertCat = db.prepare(`
  INSERT INTO categories (slug, name, description, sort_order, is_visible)
  VALUES (@slug, @name, @description, @sort_order, 1)
  ON CONFLICT(slug) DO NOTHING
`);
for (const c of CATEGORIES) insertCat.run(c);

const catCount = db.prepare('SELECT COUNT(*) c FROM categories').get().c;
console.log(`✅ Categorías: ${catCount} en BD.`);

console.log('✅ Base de datos inicializada correctamente.');
db.close();
