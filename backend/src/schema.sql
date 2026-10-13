-- ============================================================
-- AbstractFluidArt — Esquema de base de datos
-- Versión 2: incluye categorías y campos dinámicos editables
-- ============================================================

-- ---------- Artistas ----------
CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bio TEXT,
  statement TEXT,
  photo_url TEXT,
  instagram TEXT,
  whatsapp TEXT,
  email TEXT
);

-- ---------- Categorías (editables desde el admin) ----------
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,          -- "obra-original", "monotipo", "lamina-impresa"
  name TEXT NOT NULL,                 -- "Obra original", "Monotipo"
  description TEXT,                   -- texto opcional para la categoría
  sort_order INTEGER DEFAULT 0,       -- para ordenar en menús
  is_visible INTEGER DEFAULT 1,       -- visible en la web pública
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Obras ----------
CREATE TABLE IF NOT EXISTS artworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL,
  category_id INTEGER,                -- FK a categories, nullable
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,                      -- subtítulo opcional
  poetic_phrase TEXT,                 -- frase poética breve
  description TEXT,                   -- descripción larga / statement de la obra
  story TEXT,                         -- historia / contexto de la obra
  technique TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  year_month TEXT,                    -- "2026-09"
  price_cents INTEGER NOT NULL,
  stock INTEGER DEFAULT 1,
  image_url TEXT NOT NULL,
  tags TEXT,                          -- "serie:interrupcion,tecnica:acuarela"
  is_featured INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  is_available INTEGER DEFAULT 1,     -- disponible para venta
  views INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ---------- Atributos personalizados (futuro) ----------
-- Permite añadir campos libres por obra sin cambiar el esquema.
CREATE TABLE IF NOT EXISTS attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL,
  label TEXT NOT NULL,                -- "Marco incluido"
  value TEXT NOT NULL,                -- "No"
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- ---------- Clientes ----------
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ES',
  accepts_newsletter INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Pedidos ----------
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE,
  customer_id INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_ref TEXT,
  shipping_address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ---------- Líneas de pedido ----------
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  artwork_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id)
);

-- ---------- Mensajes de contacto ----------
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT, subject TEXT, body TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Newsletter ----------
CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Visitas ----------
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT, referrer TEXT, user_agent TEXT, ip_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
