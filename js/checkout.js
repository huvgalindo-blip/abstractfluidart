// ============================================================
// checkout.js — Página del carrito y checkout
// ============================================================

import { api } from './api.js';
import { cart } from './cart.js';
import { renderHeader, renderFooter } from './layout.js';

renderHeader();
renderFooter();
renderCheckout();

function renderCheckout() {
  const root = document.getElementById('checkout');
  const items = cart.read();
  const subtotal = cart.subtotalCents();

  // ---------- Carrito vacío ----------
  if (!items.length) {
    root.innerHTML = `
      <p>Tu carrito está vacío.</p>
      <a class="btn btn--primary" href="/galeria.html">Ver galería</a>`;
    return;
  }

  // ---------- Render del carrito + formulario ----------
  root.innerHTML = `
    <ul class="cart-list">
      ${items.map(i => `
        <li>
          <img src="${i.image_url}" alt="${i.title}">
          <span>${i.title} × ${i.qty}</span>
          <strong>${(i.price_cents * i.qty / 100).toFixed(2)} €</strong>
          <button data-remove="${i.id}" aria-label="Quitar">✕</button>
        </li>`).join('')}
    </ul>

    <p class="total">Subtotal: <strong>${(subtotal / 100).toFixed(2)} €</strong></p>
    <p style="font-size: 0.85rem; color: var(--color-muted);">
      Envío calculado al confirmar (gratis a partir de 100 €).
    </p>

    <h2 style="margin-top: 2rem;">Datos de envío</h2>

    <form id="checkout-form" class="checkout-form">
      <input required name="name" placeholder="Nombre completo">
      <input required name="email" type="email" placeholder="Email">
      <input required name="phone" placeholder="Teléfono">
      <input required name="address" placeholder="Dirección de envío">
      <input required name="city" placeholder="Ciudad">
      <input required name="postal_code" placeholder="Código postal">

      <fieldset>
        <legend>Método de pago</legend>
        <label><input type="radio" name="payment_method" value="bizum" checked> Bizum</label>
        <label><input type="radio" name="payment_method" value="paypal"> PayPal</label>
      </fieldset>

      <label style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.9rem;">
        <input type="checkbox" name="accepts_newsletter"> Quiero recibir novedades
      </label>

      <button class="btn btn--primary" type="submit">Confirmar pedido</button>
    </form>`;

  // ---------- Botones de "quitar" ----------
  root.querySelectorAll('[data-remove]').forEach(b =>
    b.onclick = () => {
      cart.remove(+b.dataset.remove);
      renderCheckout();
    }
  );

  // ---------- Enviar el pedido ----------
  root.querySelector('#checkout-form').onsubmit = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target));
    data.items = cart.read();
    data.accepts_newsletter = !!data.accepts_newsletter;

    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando…';

    try {
      // 1) Crear el pedido en el backend
      const order = await api.createOrder(data);

      // 2) Vaciar el carrito
      cart.clear();

      // 3) Redirigir según el método de pago
      if (data.payment_method === 'paypal') {
        const { approve_url } = await api.paypalCreate({ order_id: order.id });
        location.href = approve_url;
      } else {
        location.href = `/gracias.html?order=${order.id}&method=bizum`;
      }
    } catch (err) {
      alert('Error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar pedido';
    }
  };
}
