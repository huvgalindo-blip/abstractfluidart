// ============================================================
// seed.js — Carga inicial: artista + obras del dosier
// ============================================================

import { db } from './db.js';

const ARTIST = {
  name: 'Cristina Pacheco',
  bio: `Nace en Alicante en 1977. Licenciada en Bellas Artes por la Universitat Politècnica de València (1999-2005), con beca Erasmus en la Bauhaus-Universität Weimar (2004-2005). Cursó el Doctorado en Artes Visuales e Intermedia en la Facultad San Carlos. En 2008 se traslada a Murcia para estudiar Pedagogía, uniendo Arte y Educación. Ha realizado prácticas en el MACA (Museo de Arte Contemporáneo de Alicante) y cursos de Crítica del Arte y Filosofía del Arte. Con trayectoria activa desde el año 2000, ha participado en numerosas exposiciones individuales y colectivas.`,
  statement: `Me sitúo en la pintura desde la intuición y la apertura a lo imprevisible. No busco representar el mundo: la pintura no necesita representar algo para ser significativa. Ella es, se presenta por sí misma. Lo abstracto nació en mí porque me dejaba ser libre. Trabajo principalmente la acuarela, las tintas y los pigmentos, tierras y barro sobre papel algodón y yupo. El agua ocupa un lugar central: no solo diluye el color, sino que mezcla, expande y transforma la materia. Cada obra es un acontecimiento, un instante de transformación.`,
  instagram: 'https://www.instagram.com/xtinpache',
  whatsapp: '+34627365261',
};

const ARTWORKS = [
  { title: 'Interrupción II', technique: 'Acuarela, tinta Parker y sal sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000, image_url: '/assets/img/placeholder.svg', is_featured: 1 },
  { title: 'Interrupción', technique: 'Acuarela, tinta Parker y sal sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000, image_url: '/assets/img/placeholder.svg' },
  { title: 'La habitación del ser humano IV', technique: 'Acuarela, tinta china y grafito sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-07', price_cents: 20000, image_url: '/assets/img/placeholder.svg' },
  { title: 'El refugio', technique: 'Acuarela y Art Graf sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-07', price_cents: 18000, image_url: '/assets/img/placeholder.svg' },
  { title: 'Geometría', technique: 'Acuarela sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-09', price_cents: 18000, image_url: '/assets/img/placeholder.svg' },
  { title: 'La lengua es la casa del ser', technique: 'Pigmentos tierra sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-11', price_cents: 22000, image_url: '/assets/img/placeholder.svg', is_featured: 1 },
  { title: 'Lo irrepetible', technique: 'Pigmentos tierra sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-08', price_cents: 22000, image_url: '/assets/img/placeholder.svg' },
  { title: 'Supervivencia de las luciérnagas', technique: 'Acuarela, tinta Parker y lejía sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-04', price_cents: 24000, image_url: '/assets/img/placeholder.svg', is_featured: 1 },
  { title: 'Los trazos se han caído', technique: 'Pigmentos tierra sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-12', price_cents: 22000, image_url: '/assets/img/placeholder.svg' },
  { title: '¿qué necesito ver realmente para sentir que he vivido?', technique: 'Tinta Parker sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000, image_url: '/assets/img/placeholder.svg' },
  { title: 'Poética de la fragilidad', technique: 'Acuarela y tinta Parker sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-10', price_cents: 18000, image_url: '/assets/img/placeholder.svg' },
  { title: 'La tierra es plana', technique: 'Acuarela sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-01', price_cents: 18000, image_url: '/assets/img/placeholder.svg' },
  { title: 'La habitación del ser humano', technique: 'Acuarela y tinta Parker sobre papel algodón', dimensions: '50 x 70 cm', year_month: '2026-07', price_cents: 45000, image_url: '/assets/img/placeholder.svg', is_featured: 1 },
  { title: 'Refugio en papel', technique: 'Acuarela, tinta china y barro sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-08', price_cents: 20000, image_url: '/assets/img/placeholder.svg' },
  { title: 'Sin título', technique: 'Tinta Parker sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 15000, image_url: '/assets/img/placeholder.svg' },
];

const slugify = s => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 60);

const run = db.transaction(() => {
  db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM artworks; DELETE FROM artists;');

  const artistId = db.prepare(`
    INSERT INTO artists (name, bio, statement, instagram, whatsapp)
    VALUES (@name, @bio, @statement, @instagram, @whatsapp)
  `).run(ARTIST).lastInsertRowid;

  const insert = db.prepare(`
    INSERT INTO artworks
      (artist_id, slug, title, technique, dimensions, year_month, price_cents, image_url, is_featured, is_published)
    VALUES
      (@artist_id, @slug, @title, @technique, @dimensions, @year_month, @price_cents, @image_url, @is_featured, 1)
  `);

  for (const a of ARTWORKS) {
    insert.run({
      artist_id: artistId,
      slug: slugify(a.title) || `obra-${Date.now()}`,
      is_featured: a.is_featured ?? 0,
      ...a,
    });
  }
});

run();
console.log(`✅ Seed OK: 1 artista + ${ARTWORKS.length} obras.`);
