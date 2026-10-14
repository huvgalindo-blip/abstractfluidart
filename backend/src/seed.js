// ============================================================
// seed.js — Carga inicial de la base de datos
// Artista + 31 obras con datos provisionales (editables luego).
// ============================================================

import { db } from './db.js';

// ------------------------------------------------------------
// 1) Artista
// ------------------------------------------------------------
const ARTIST = {
  name: 'Cristina Pacheco',
  bio: `Nace en Alicante en 1977. Licenciada en Bellas Artes por la Universitat Politècnica de València (1999-2005), con beca Erasmus en la Bauhaus-Universität Weimar (2004-2005). Cursó el Doctorado en Artes Visuales e Intermedia en la Facultad San Carlos. En 2008 se traslada a Murcia para estudiar Pedagogía, uniendo Arte y Educación. Ha realizado prácticas en el MACA (Museo de Arte Contemporáneo de Alicante) y cursos de Crítica del Arte y Filosofía del Arte. Con trayectoria activa desde el año 2000, ha participado en numerosas exposiciones individuales y colectivas.`,
  statement: `Me sitúo en la pintura desde la intuición y la apertura a lo imprevisible. No busco representar el mundo: la pintura no necesita representar algo para ser significativa. Ella es, se presenta por sí misma. Lo abstracto nació en mí porque me dejaba ser libre. Trabajo principalmente la acuarela, las tintas y los pigmentos, tierras y barro sobre papel algodón y yupo. El agua ocupa un lugar central: no solo diluye el color, sino que mezcla, expande y transforma la materia. Cada obra es un acontecimiento, un instante de transformación.`,
  instagram: 'https://www.instagram.com/xtinpache',
  whatsapp: '+34627365261',
  email: 'xtinpacheco@gmail.com',
};

// ------------------------------------------------------------
// 2) Obras
// Datos PROVISIONALES — editables desde el panel de admin.
// Cuando Cristina confirme, se cambiarán sin tocar código.
// ------------------------------------------------------------
const ARTWORKS = [
  // --- Serie Interrupción ---
  { title: 'Interrupción 01',              image: 'interrupcion01.jpg',            category: 'obra-original', technique: 'Acuarela, tinta Parker y sal sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000 },
  { title: 'Interrupción 02',              image: 'interrupcion02.jpg',            category: 'obra-original', technique: 'Acuarela, tinta Parker y sal sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000 },

  // --- Serie Intuición ---
  { title: 'Intuición 01',                 image: 'intuicion01.jpg',               category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2026-06', price_cents: 18000 },
  { title: 'Intuición 02',                 image: 'intuicion02.jpg',               category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2026-06', price_cents: 18000 },

  // --- Serie Modos de ver ---
  { title: 'Modos de ver I',               image: 'modos_de_ver_i.jpg',            category: 'obra-original', technique: 'Acuarela y grafito sobre papel algodón',           dimensions: '42 x 30 cm', year_month: '2026-05', price_cents: 20000 },
  { title: 'Modos de ver III',             image: 'modos_de_ver_iii.jpg',          category: 'obra-original', technique: 'Acuarela y grafito sobre papel algodón',           dimensions: '42 x 30 cm', year_month: '2026-05', price_cents: 20000 },
  { title: 'Modos de ver IV',              image: 'modos_de_ver_iv.jpg',           category: 'obra-original', technique: 'Acuarela y grafito sobre papel algodón',           dimensions: '42 x 30 cm', year_month: '2026-05', price_cents: 20000 },

  // --- Serie ¿qué necesito ver realmente... ---
  { title: '¿Qué necesito ver realmente para sentir que he vivido? 01', image: 'que_necesito_ver_realmente_para_sentir_que_he_vivido_01.jpg', category: 'obra-original', technique: 'Tinta Parker sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000 },
  { title: '¿Qué necesito ver realmente para sentir que he vivido? 02', image: 'que_necesito_ver_realmente_para_sentir_que_he_vivido_02.jpg', category: 'obra-original', technique: 'Tinta Parker sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000 },
  { title: '¿Qué necesito ver realmente para sentir que he vivido? 03', image: 'que_necesito_ver_realmente_para_sentir_que_he_vivido_03.jpg', category: 'obra-original', technique: 'Tinta Parker sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000 },

  // --- Obras individuales ---
  { title: 'Agua',                         image: 'agua.jpg',                      category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2026-03', price_cents: 18000 },
  { title: 'Caosmosis II',                 image: 'caosmosis_ii.jpg',              category: 'obra-original', technique: 'Acuarela y tinta sobre papel algodón',            dimensions: '42 x 30 cm', year_month: '2025-11', price_cents: 20000 },
  { title: 'El arte sigue siendo un lugar de resistencia', image: 'el_arte_sigue_siendo_un_lugar_de_resistencia.jpg', category: 'obra-original', technique: 'Acuarela sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-02', price_cents: 20000 },
  { title: 'El refugio',                   image: 'el_refugio.jpg',                category: 'obra-original', technique: 'Acuarela y Art Graf sobre papel algodón',         dimensions: '42 x 30 cm', year_month: '2026-07', price_cents: 18000 },
  { title: 'El tiempo humano se rompe',    image: 'el_tiempo_humano_se_rompe.jpg', category: 'obra-original', technique: 'Acuarela y tinta Parker sobre papel algodón',     dimensions: '42 x 30 cm', year_month: '2026-04', price_cents: 20000 },
  { title: 'Escuchar la pintura',          image: 'escuchar_la_pintura.jpg',       category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2026-08', price_cents: 18000 },
  { title: 'Fuego',                        image: 'fuego.jpg',                     category: 'obra-original', technique: 'Acuarela y pigmentos tierra sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-12', price_cents: 22000 },
  { title: 'Geometría',                    image: 'geometria.jpg',                 category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2025-09', price_cents: 18000 },
  { title: 'Imagen desobediente',          image: 'imagen_desobediente.jpg',       category: 'obra-original', technique: 'Acuarela y tinta sobre papel algodón',            dimensions: '42 x 30 cm', year_month: '2026-01', price_cents: 20000 },
  { title: 'La balsa de la medusa',        image: 'la_balsa_de_la_medusa.jpg',     category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2025-10', price_cents: 22000 },
  { title: 'La experiencia de un encuentro II', image: 'la_experiencia_de_un_encuentro_ii.jpg', category: 'obra-original', technique: 'Acuarela, tinta Parker y sal sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 18000 },
  { title: 'La habitación del ser humano IV', image: 'la_habitacion_del_ser_humano_iv.jpg', category: 'obra-original', technique: 'Acuarela, tinta china y grafito sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2026-07', price_cents: 20000 },
  { title: 'La obra se vuelve espejo',     image: 'la_obra_se_vuelve_espejo.jpg',  category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2026-08', price_cents: 18000 },
  { title: 'La tierra es plana',           image: 'la_tierra_es_plana.jpg',        category: 'obra-original', technique: 'Acuarela sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2026-01', price_cents: 18000 },
  { title: 'La tierra ya no resiste',      image: 'la_tierra_ya_no_resiste.jpg',   category: 'obra-original', technique: 'Pigmentos tierra sobre papel algodón',            dimensions: '42 x 30 cm', year_month: '2026-04', price_cents: 22000 },
  { title: 'Lo irrepetible',               image: 'lo_irrepetible.jpg',            category: 'obra-original', technique: 'Pigmentos tierra sobre papel algodón',            dimensions: '42 x 30 cm', year_month: '2025-08', price_cents: 22000 },

  // --- Monotipo ---
  { title: 'Monotipo 01',                  image: 'monotipos_01.jpg',              category: 'monotipo',      technique: 'Monotipo sobre papel algodón',                    dimensions: '42 x 30 cm', year_month: '2025-05', price_cents: 15000 },

  // --- Resto de obras individuales ---
  { title: 'Origen',                       image: 'origen.jpg',                    category: 'obra-original', technique: 'Acuarela y pigmentos tierra sobre papel algodón', dimensions: '50 x 70 cm', year_month: '2026-07', price_cents: 45000 },
  { title: 'Refugio en papel',             image: 'refugio_en_papel.jpg',          category: 'obra-original', technique: 'Acuarela, tinta china y barro sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-08', price_cents: 20000 },
  { title: 'Resistencia de lo invisible 03', image: 'resistencia_de_lo_invisible_03.jpg', category: 'obra-original', technique: 'Acuarela, tinta Parker y lejía sobre papel algodón', dimensions: '42 x 30 cm', year_month: '2025-04', price_cents: 24000 },
  { title: 'Sin título',                   image: 'sin_titulo.jpg',                category: 'obra-original', technique: 'Tinta Parker sobre papel algodón',                dimensions: '42 x 30 cm', year_month: '2026-09', price_cents: 15000 },
];

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------

// Convierte "La lengua es la casa del ser" en "la-lengua-es-la-casa-del-ser"
const slugify = (s) => s
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quita tildes
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 80);

// ------------------------------------------------------------
// Ejecución
// ------------------------------------------------------------
const run = db.transaction(() => {
  // 1) Limpia (para poder re-ejecutar sin duplicar)
  db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM attributes; DELETE FROM artworks; DELETE FROM artists;');

  // 2) Inserta artista
  const artistId = db.prepare(`
    INSERT INTO artists (name, bio, statement, instagram, whatsapp, email)
    VALUES (@name, @bio, @statement, @instagram, @whatsapp, @email)
  `).run(ARTIST).lastInsertRowid;

  // 3) Mapa de categorías (slug → id)
  const categoryRows = db.prepare('SELECT id, slug FROM categories').all();
  const categoryMap = Object.fromEntries(categoryRows.map(r => [r.slug, r.id]));

  // 4) Inserta obras
  const insert = db.prepare(`
    INSERT INTO artworks
      (artist_id, category_id, slug, title, technique, dimensions, year_month,
       price_cents, image_url, is_featured, is_published, is_available)
    VALUES
      (@artist_id, @category_id, @slug, @title, @technique, @dimensions, @year_month,
       @price_cents, @image_url, 0, 1, 1)
  `);

  const usedSlugs = new Set();
  for (const a of ARTWORKS) {
    // slug único (por si dos obras tienen el mismo título)
    let slug = slugify(a.title);
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(a.title)}-${suffix++}`;
    usedSlugs.add(slug);

    insert.run({
      artist_id: artistId,
      category_id: categoryMap[a.category] ?? null,
      slug,
      title: a.title,
      technique: a.technique,
      dimensions: a.dimensions,
      year_month: a.year_month,
      price_cents: a.price_cents,
      image_url: `/assets/img/${a.image}`,
    });
  }
});

run();

const counts = {
  artists: db.prepare('SELECT COUNT(*) c FROM artists').get().c,
  categories: db.prepare('SELECT COUNT(*) c FROM categories').get().c,
  artworks: db.prepare('SELECT COUNT(*) c FROM artworks').get().c,
};
console.log(`✅ Seed OK: ${counts.artists} artista, ${counts.categories} categorías, ${counts.artworks} obras.`);
