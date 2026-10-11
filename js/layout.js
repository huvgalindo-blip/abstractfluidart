// ============================================================
// layout.js — Cabecera y pie compartidos
// ============================================================

import { cart } from './cart.js';

export function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;

  el.className = 'site-header';
  el.innerHTML = `
    <div class="container">
      <a href="/" class="site-header__brand">AbstractFluidArt</a>
      <nav class="site-header__nav">
        <a href="/galeria.html">Galería</a>
        <a href="/sobre.html">Sobre Cristina</a>
        <a href="/contacto.html">Contacto</a>
        <a href="/carrito.html" class="site-header__cart">
          Carrito <span class="site-header__cart-count" id="cart-count">0</span>
        </a>
      </nav>
    </div>
  `;

  // Actualiza el contador del carrito
  const update = () => {
    const c = document.getElementById('cart-count');
    if (c) c.textContent = cart.count();
  };
  update();
  cart.onChange(update);
}

export function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;

  el.className = 'site-footer';
  el.innerHTML = `
    <div class="container">
      <div>© ${new Date().getFullYear()} AbstractFluidArt · Cristina Pacheco</div>
      <div>
        <a href="https://www.instagram.com/xtinpache" target="_blank" rel="noopener">Instagram</a> ·
        <a href="https://wa.me/34627365261" target="_blank" rel="noopener">WhatsApp</a> ·
        <a href="/contacto.html">Contacto</a>
      </div>
    </div>
  `;
}
