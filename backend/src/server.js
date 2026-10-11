// ============================================================
// server.js — Servidor principal
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

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

// Analítica simple
app.use((req, _res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/assets')) {
    const ip = req.ip || '';
    const ip_hash = crypto.createHash('sha256').update(ip + 'afa').digest('hex').slice(0, 16);
    try {
      db.prepare('INSERT INTO visits (path, referrer, user_agent, ip_hash) VALUES (?,?,?,?)')
        .run(req.path, req.get('referer') || null, req.get('user-agent') || null, ip_hash);
    } catch (_) {}
  }
  next();
});

// --- API ---

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/artworks', (req, res) => {
  const { featured, limit = 50 } = req.query;
  const where = ['is_published = 1'];
  if (featured) where.push('is_featured = 1');
  const sql = `SELECT * FROM artworks WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`;
  res.json(db.prepare(sql).all(+limit));
});

app.get('/api/artworks/:slug', (req, res) => {
  const { slug } = req.params;
  const row = db.prepare('SELECT * FROM artworks WHERE slug = ? OR id = ?').get(slug, slug);
  if (!row) return res.status(404).json({ error: 'Obra no encontrada' });
  db.prepare('UPDATE artworks SET views = views + 1 WHERE id = ?').run(row.id);
  res.json(row);
});

app.get('/api/payments/public', (_req, res) => {
  res.json({ bizum_phone: process.env.BIZUM_PHONE || '+34627365261' });
});

app.get('/api/artist', (_req, res) => {
  const artist = db.prepare('SELECT name, bio, statement, instagram, whatsapp FROM artists LIMIT 1').get();
  if (!artist) return res.status(404).json({ error: 'Sin artista' });
  res.json(artist);
});

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

    const getArt = db.prepare('SELECT id, price_cents, stock, is_published FROM artworks WHERE id = ?');
    let subtotal = 0;
    for (const it of items) {
      const row = getArt.get(it.id);
      if (!row || !row.is_published) throw new Error(`Obra ${it.id} no disponible`);
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

  try {
    res.json({ ...tx(), status: 'pending' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, c.name, c.email FROM orders o
    JOIN customers c ON c.id = o.customer_id WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, body } = req.body;
  if (!email || !body) return res.status(400).json({ error: 'Faltan campos' });
  db.prepare('INSERT INTO messages (name, email, subject, body) VALUES (?,?,?,?)')
    .run(name || null, email, subject || null, body);
  res.json({ ok: true });
});

app.post('/api/contact/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try { db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email); }
  catch (_) {}
  res.json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Credenciales incorrectas' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.use(express.static(ROOT));
app.use('/admin', express.static(path.join(ROOT, 'admin')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎨 AbstractFluidArt escuchando en puerto ${PORT}`);
});
