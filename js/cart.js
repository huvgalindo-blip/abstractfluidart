// ============================================================
// cart.js — Carrito persistido en localStorage
// ============================================================

const KEY = 'afa_cart';
const listeners = new Set();

function emit() {
  const items = read();
  listeners.forEach(fn => fn(items));
  document.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
}

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  emit();
}

export const cart = {
  read,

  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  add(artwork, qty = 1) {
    const items = read();
    const found = items.find(i => i.id === artwork.id);
    if (found) {
      found.qty += qty;
    } else {
      items.push({
        id: artwork.id,
        slug: artwork.slug,
        title: artwork.title,
        price_cents: artwork.price_cents,
        image_url: artwork.image_url,
        qty,
      });
    }
    write(items);
  },

  remove(id) {
    write(read().filter(i => i.id !== id));
  },

  clear() {
    write([]);
  },

  count() {
    return read().reduce((s, i) => s + i.qty, 0);
  },

  subtotalCents() {
    return read().reduce((s, i) => s + i.price_cents * i.qty, 0);
  },
};
