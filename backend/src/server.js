// ============================================================
// server.js — Servidor principal de AbstractFluidArt
// API pública + API admin + frontend estático
// ============================================================

import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const app = express();

// ---------------- Middlewares base ----------------
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

// ---------------- Analítica simple ----------------
app.use((req, _res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/assets') && !req.path.startsWith('/api/admin')) {
    const ip = req.ip || '';
    const ip_hash = crypto.createHash('sha256').update(ip + 'afa').digest('hex').slice(0, 16);
    try {
      db.prepare('INSERT INTO visits (path, referrer, user_agent, ip_hash) VALUES (?,?,?,?)')
        .run(req.path, req.get('referer') || null, req.get('user-agent') || null, ip_hash);
    } catch (_) { /* nunca romper la petición */ }
  }
  next();
});

// Middleware de autenticación para rutas admin
function requireAdmin(req, res, next) {
  if (req.session?.admin) return next();
  return res.status(401).json({ error: 'No autenticado' });
}

// ============================================================
// API PÚBLICA
// ============================================================

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Datos de la artista
app.get('/api/artist', (_req, res) => {
  const artist = db.prepare('SELECT * FROM artists LIMIT 1').get();
  if (!artist) return res.status(404).json({ error: 'Sin artista' });
  res.json(artist);
});

// Listado de categorías visibles
app.get('/api/categories', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categories WHERE is_visible = 1 ORDER BY sort_order, name').all();
  res.json(rows);
});

// Listado de obras (filtrable)
// Si se pide ?featured=1 y no hay destacadas, devuelve las 6 últimas publicadas.
app.get('/api/artworks', (req, res) => {
  const { featured, category, limit = 100 } = req.query;
  const where = ['is_published = 1'];
  const params = [];

  if (featured) where.push('is_featured = 1');
  if (category) {
    where.push('category_id = (SELECT id FROM categories WHERE slug = ?)');
    params.push(category);
  }

  const sql = `SELECT a.*, c.slug AS category_slug, c.name AS category_name
               FROM artworks a
               LEFT JOIN categories c ON c.id = a.category_id
               WHERE ${where.join(' AND ')}
               ORDER BY a.sort_order, a.created_at DESC
               LIMIT ?`;

  let rows = db.prepare(sql).all(...params, +limit);

  // Fallback: si pedían destacadas y no hay ninguna, mostramos las 6 últimas
  if (featured && rows.length === 0) {
    rows = db.prepare(`
      SELECT a.*, c.slug AS category_slug, c.name AS category_name
      FROM artworks a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.is_published = 1
      ORDER BY a.created_at DESC
      LIMIT 6
    `).all();
  }

  res.json(rows);
});

// Detalle de una obra
app.get('/api/artworks/:slug', (req, res) => {
  const { slug } = req.params;
  const row = db.prepare(`
    SELECT a.*, c.slug AS category_slug, c.name AS category_name
    FROM artworks a
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.slug = ? OR a.id = ?
  `).get(slug, slug);
  if (!row) return res.status(404).json({ error: 'Obra no encontrada' });

  db.prepare('UPDATE artworks SET views = views + 1 WHERE id = ?').run(row.id);
  const attributes = db.prepare('SELECT label, value FROM attributes WHERE artwork_id = ? ORDER BY sort_order').all(row.id);
  res.json({ ...row, attributes });
});

// Datos públicos de pago
app.get('/api/payments/public', (_req, res) => {
  res.json({ bizum_phone: process.env.BIZUM_PHONE || '+34627365261' });
});

// Crear pedido
app.post('/api/orders', (req, res) => {
  const { name, email, phone, address, city, postal_code, payment_method, items, notes, accepts_newsletter } = req.body;

  if (!items?.length) return res.status(400).json({ error: 'El carrito está vacío' });
  if (!['bizum', 'paypal'].includes(payment_method))
    return res.status(400).json({ error: 'Método de pago inválido' });

  const tx = db.transaction(() => {
    let customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
    if (!customer) {
      const info = db.prepare(`
        INSERT INTO customers (email, name, phone, address, city, postal_code, accepts_newsletter)
        VALUES (?,?,?,?,?,?,?)
      `).run(email, name, phone, address, city, postal_code, accepts_newsletter ? 1 : 0);
      customer = { id: info.lastInsertRowid };
    } else {
      db.prepare('UPDATE customers SET name=?, phone=?, address=?, city=?, postal_code=? WHERE id=?')
        .run(name, phone, address, city, postal_code, customer.id);
    }

    const getArt = db.prepare('SELECT id, price_cents, stock, is_published, is_available FROM artworks WHERE id = ?');
    let subtotal = 0;
    for (const it of items) {
      const row = getArt.get(it.id);
      if (!row || !row.is_published || !row.is_available) throw new Error(`Obra ${it.id} no disponible`);
      if (row.stock < it.qty) throw new Error(`Sin stock para la obra ${it.id}`);
      subtotal += row.price_cents * it.qty;
    }

    const freeFrom = +(process.env.SHIPPING_FREE_FROM_CENTS || 10000);
    const flat = +(process.env.SHIPPING_FLAT_CENTS || 690);
    const shipping = subtotal >= freeFrom ? 0 : flat;
    const total = subtotal + shipping;

    const reference = `AFA-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const orderInfo = db.prepare(`
      INSERT INTO orders (reference, customer_id, subtotal_cents, shipping_cents, total_cents,
                          status, payment_method, shipping_address, notes)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(reference, customer.id, subtotal, shipping, total, 'pending', payment_method,
           `${address}, ${postal_code} ${city}`, notes || null);

    const insItem = db.prepare('INSERT INTO order_items (order_id, artwork_id, quantity, unit_price_cents) VALUES (?,?,?,?)');
    const decStock = db.prepare('UPDATE artworks SET stock = stock - ? WHERE id = ?');
    for (const it of items) {
      const row = getArt.get(it.id);
      insItem.run(orderInfo.lastInsertRowid, it.id, it.qty, row.price_cents);
      decStock.run(it.qty, it.id);
    }

    return { id: orderInfo.lastInsertRowid, reference, total };
  });

  try { res.json({ ...tx(), status: 'pending' }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Detalle de pedido público (para la página de gracias)
app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, c.name, c.email FROM orders o
    JOIN customers c ON c.id = o.customer_id WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// Contacto
app.post('/api/contact', (req, res) => {
  const { name, email, subject, body } = req.body;
  if (!email || !body) return res.status(400).json({ error: 'Faltan campos' });
  db.prepare('INSERT INTO messages (name, email, subject, body) VALUES (?,?,?,?)')
    .run(name || null, email, subject || null, body);
  res.json({ ok: true });
});

// Newsletter
app.post('/api/contact/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try { db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email); } catch (_) {}
  res.json({ ok: true });
});

// ============================================================
// API ADMIN (requiere login)
// ============================================================

// Login
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

// Logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ¿Estoy logueado?
app.get('/api/admin/me', (req, res) => {
  res.json({ admin: !!req.session?.admin });
});

// Dashboard stats
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const visitsToday = db.prepare("SELECT COUNT(*) c FROM visits WHERE date(created_at) = date('now')").get().c;
  const pending = db.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'pending'").get().c;
  const revenue = db.prepare("SELECT COALESCE(SUM(total_cents),0) s FROM orders WHERE status='paid' AND strftime('%Y-%m', created_at) = strftime('%Y-%m','now')").get().s;
  const published = db.prepare("SELECT COUNT(*) c FROM artworks WHERE is_published = 1").get().c;
  const totalArtworks = db.prepare("SELECT COUNT(*) c FROM artworks").get().c;
  const totalOrders = db.prepare("SELECT COUNT(*) c FROM orders").get().c;
  const unreadMessages = db.prepare("SELECT COUNT(*) c FROM messages WHERE is_read = 0").get().c;

  res.json({
    visits_today: visitsToday,
    pending_orders: pending,
    revenue_month_cents: revenue,
    published_artworks: published,
    total_artworks: totalArtworks,
    total_orders: totalOrders,
    unread_messages: unreadMessages,
  });
});

// ---------- Artworks (admin) ----------

app.get('/api/admin/artworks', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT a.*, c.name AS category_name, c.slug AS category_slug
    FROM artworks a
    LEFT JOIN categories c ON c.id = a.category_id
    ORDER BY a.sort_order, a.created_at DESC
  `).all();
  res.json(rows);
});

app.post('/api/admin/artworks', requireAdmin, (req, res) => {
  const data = req.body;
  const required = ['title', 'technique', 'dimensions', 'price_cents', 'image_url'];
  for (const f of required) {
    if (data[f] === undefined || data[f] === null || data[f] === '') {
      return res.status(400).json({ error: `Campo obligatorio: ${f}` });
    }
  }

  const slug = data.slug || slugify(data.title);
  const artist = db.prepare('SELECT id FROM artists LIMIT 1').get();

  try {
    const info = db.prepare(`
      INSERT INTO artworks
        (artist_id, category_id, slug, title, subtitle, poetic_phrase, description, story,
         technique, dimensions, year_month, price_cents, stock, image_url, tags,
         is_featured, is_published, is_available, sort_order)
      VALUES
        (@artist_id, @category_id, @slug, @title, @subtitle, @poetic_phrase, @description, @story,
         @technique, @dimensions, @year_month, @price_cents, @stock, @image_url, @tags,
         @is_featured, @is_published, @is_available, @sort_order)
    `).run({
      artist_id: artist?.id ?? 1,
      category_id: data.category_id ?? null,
      slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      poetic_phrase: data.poetic_phrase ?? null,
      description: data.description ?? null,
      story: data.story ?? null,
      technique: data.technique,
      dimensions: data.dimensions,
      year_month: data.year_month ?? null,
      price_cents: +data.price_cents,
      stock: data.stock ?? 1,
      image_url: data.image_url,
      tags: data.tags ?? null,
      is_featured: data.is_featured ? 1 : 0,
      is_published: data.is_published === false ? 0 : 1,
      is_available: data.is_available === false ? 0 : 1,
      sort_order: data.sort_order ?? 0,
    });
    res.json({ id: info.lastInsertRowid, slug });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/artworks/:id', requireAdmin, (req, res) => {
  const id = +req.params.id;
  const existing = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Obra no encontrada' });

  const data = { ...existing, ...req.body };
  if (req.body.title && !req.body.slug) data.slug = slugify(req.body.title);

  try {
    db.prepare(`
      UPDATE artworks SET
        category_id = @category_id, slug = @slug, title = @title, subtitle = @subtitle,
        poetic_phrase = @poetic_phrase, description = @description, story = @story,
        technique = @technique, dimensions = @dimensions, year_month = @year_month,
        price_cents = @price_cents, stock = @stock, image_url = @image_url, tags = @tags,
        is_featured = @is_featured, is_published = @is_published, is_available = @is_available,
        sort_order = @sort_order
      WHERE id = @id
    `).run({
      id,
      category_id: data.category_id ?? null,
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      poetic_phrase: data.poetic_phrase ?? null,
      description: data.description ?? null,
      story: data.story ?? null,
      technique: data.technique,
      dimensions: data.dimensions,
      year_month: data.year_month ?? null,
      price_cents: +data.price_cents,
      stock: data.stock ?? 1,
      image_url: data.image_url,
      tags: data.tags ?? null,
      is_featured: data.is_featured ? 1 : 0,
      is_published: data.is_published ? 1 : 0,
      is_available: data.is_available ? 1 : 0,
      sort_order: data.sort_order ?? 0,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/artworks/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM attributes WHERE artwork_id = ?').run(req.params.id);
  db.prepare('DELETE FROM artworks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Categories (admin) ----------

app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all());
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { slug, name, description, sort_order, is_visible } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'slug y name obligatorios' });
  try {
    const info = db.prepare(`
      INSERT INTO categories (slug, name, description, sort_order, is_visible)
      VALUES (?,?,?,?,?)
    `).run(slug, name, description ?? null, sort_order ?? 0, is_visible === false ? 0 : 1);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const { slug, name, description, sort_order, is_visible } = req.body;
  try {
    db.prepare(`
      UPDATE categories SET slug=?, name=?, description=?, sort_order=?, is_visible=?
      WHERE id=?
    `).run(slug, name, description ?? null, sort_order ?? 0, is_visible ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE artworks SET category_id = NULL WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Orders (admin) ----------

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT o.*, c.name AS customer_name, c.email AS customer_email
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(rows);
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { status, payment_ref, notes } = req.body;
  db.prepare('UPDATE orders SET status=?, payment_ref=?, notes=? WHERE id=?')
    .run(status, payment_ref ?? null, notes ?? null, req.params.id);
  res.json({ ok: true });
});

// ---------- Messages (admin) ----------

app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all());
});

app.put('/api/admin/messages/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// FRONTEND ESTÁTICO + ADMIN
// ============================================================

// Redirige /admin a /admin/index.html si no hay sesión
app.use('/admin', (req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') return next();
  if (req.session?.admin) return next();
  return res.redirect('/admin/index.html');
});

app.use(express.static(ROOT));
app.use('/admin', express.static(path.join(ROOT, 'admin')));

// ============================================================
// Utilidad
// ============================================================
function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

// ============================================================
// Arranque
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎨 AbstractFluidArt escuchando en puerto ${PORT}`);
});
