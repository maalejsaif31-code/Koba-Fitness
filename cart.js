/* ============================================================
   KOBA FITNESS — Panier, code promo & PayPal (partagé)
   Nécessite shop-data.js chargé avant ce fichier.
   ============================================================ */

let cart = JSON.parse(localStorage.getItem('kobaCart') || '[]'); // {name, price, qty}
let appliedPromo = JSON.parse(localStorage.getItem('kobaAppliedPromo') || 'null'); // {code, type, value}

function saveCart(){ localStorage.setItem('kobaCart', JSON.stringify(cart)); }
function savePromoState(){ localStorage.setItem('kobaAppliedPromo', JSON.stringify(appliedPromo)); }

function cartSubtotal(){
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartDiscount(subtotal){
  if(!appliedPromo) return 0;
  if(appliedPromo.type === 'percent'){
    return subtotal * (appliedPromo.value / 100);
  }
  return Math.min(appliedPromo.value, subtotal);
}

function cartTotal(){
  const subtotal = cartSubtotal();
  return Math.max(0, subtotal - cartDiscount(subtotal));
}

function addToCart(name, price){
  const existing = cart.find(item => item.name === name);
  if(existing){ existing.qty++; } else { cart.push({ name, price, qty: 1 }); }
  saveCart();
  renderCart();
  renderPaypalButton();
}

function renderCart(){
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.querySelector('.cart-count');
  if(!itemsEl || !totalEl) return;

  if(cart.length === 0){
    itemsEl.innerHTML = '<p class="cart-empty">Ton panier est vide.</p>';
  } else {
    itemsEl.innerHTML = cart.map((item, i) => `
      <div class="cart-line">
        <div>
          <div class="cart-line-name">${item.name}</div>
          <div class="cart-line-qty">Qté : ${item.qty}</div>
        </div>
        <div style="display:flex;align-items:center;">
          <span class="cart-line-price">${formatPrice(item.price * item.qty)}</span>
          <button class="cart-line-remove" data-index="${i}" aria-label="Retirer">✕</button>
        </div>
      </div>
    `).join('');
  }

  const subtotal = cartSubtotal();
  const discount = cartDiscount(subtotal);
  const total = cartTotal();

  const subtotalRow = document.getElementById('cartSubtotalRow');
  const discountRow = document.getElementById('cartDiscountRow');
  if(subtotalRow) subtotalRow.style.display = appliedPromo ? 'flex' : 'none';
  if(document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  if(discountRow) discountRow.style.display = appliedPromo ? 'flex' : 'none';
  if(document.getElementById('cartDiscountLabel') && appliedPromo){
    document.getElementById('cartDiscountLabel').textContent =
      'Code ' + appliedPromo.code + (appliedPromo.type === 'percent' ? ' (-' + appliedPromo.value + '%)' : ' (remise fixe)');
  }
  if(document.getElementById('cartDiscount')) document.getElementById('cartDiscount').textContent = '- ' + formatPrice(discount);

  totalEl.textContent = formatPrice(total);
  if(countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

  const promoMsg = document.getElementById('promoMessage');
  if(promoMsg){
    if(appliedPromo){
      promoMsg.textContent = 'Code "' + appliedPromo.code + '" appliqué ✓';
      promoMsg.className = 'promo-message promo-ok';
    } else {
      promoMsg.textContent = '';
      promoMsg.className = 'promo-message';
    }
  }

  itemsEl.querySelectorAll('.cart-line-remove').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      cart.splice(parseInt(e.currentTarget.dataset.index), 1);
      saveCart();
      renderCart();
      renderPaypalButton();
    });
  });
}

async function applyPromoCode(rawCode){
  const promoMsg = document.getElementById('promoMessage');
  const code = (rawCode || '').trim().toUpperCase();
  if(!code){
    appliedPromo = null;
    savePromoState();
    renderCart();
    renderPaypalButton();
    return;
  }
  if(promoMsg){ promoMsg.textContent = 'Vérification du code...'; promoMsg.className = 'promo-message'; }
  const found = await validatePromoCode(code);
  if(found){
    appliedPromo = found;
    savePromoState();
  } else {
    appliedPromo = null;
    savePromoState();
    if(promoMsg){
      promoMsg.textContent = 'Code promo invalide ou expiré.';
      promoMsg.className = 'promo-message promo-error';
    }
  }
  renderCart();
  renderPaypalButton();
}

function initCartDrawer(){
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const cartBtn = document.querySelector('.cart-btn');
  if(!drawer || !overlay || !cartBtn) return;

  function openCart(){ drawer.classList.add('open'); overlay.classList.add('open'); }
  function closeCart(){ drawer.classList.remove('open'); overlay.classList.remove('open'); }

  cartBtn.addEventListener('click', openCart);
  const closeBtn = document.getElementById('cartClose');
  if(closeBtn) closeBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);

  const promoBtn = document.getElementById('promoApplyBtn');
  const promoInput = document.getElementById('promoInput');
  if(promoBtn && promoInput){
    promoBtn.addEventListener('click', () => applyPromoCode(promoInput.value));
    promoInput.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); applyPromoCode(promoInput.value); } });
    if(appliedPromo) promoInput.value = appliedPromo.code;
  }

  window.kobaOpenCart = openCart;
  window.kobaCloseCart = closeCart;
}

function paypalOrderConfig(){
  return {
    createOrder: function(data, actions){
      const total = cartTotal();
      return actions.order.create({
        purchase_units: [{ amount: { value: total.toFixed(2), currency_code: 'EUR' } }]
      });
    },
    onApprove: function(data, actions){
      return actions.order.capture().then(function(details){
        alert('Merci ' + (details.payer && details.payer.name ? details.payer.name.given_name : '') + ' ! Ta commande a bien été payée.');
        cart = [];
        appliedPromo = null;
        saveCart();
        savePromoState();
        renderCart();
        renderPaypalButton();
        if(window.kobaCloseCart) window.kobaCloseCart();
      });
    },
    onError: function(err){
      console.error(err);
      alert("Une erreur est survenue avec le paiement. Réessaie.");
    }
  };
}

function renderPaypalButton(){
  const container = document.getElementById('paypal-button-container');
  const appleContainer = document.getElementById('applepay-button-container');
  const loginPrompt = document.getElementById('loginToPayPrompt');
  if(!container || typeof paypal === 'undefined') return;
  container.innerHTML = '';
  if(appleContainer) appleContainer.innerHTML = '';
  const total = cartTotal();
  if(total <= 0){
    if(loginPrompt) loginPrompt.style.display = 'none';
    return;
  }

  // ---- Connexion obligatoire avant de pouvoir payer ----
  const isLoggedIn = typeof auth !== 'undefined' && auth.currentUser;
  if(!isLoggedIn){
    if(loginPrompt) loginPrompt.style.display = 'block';
    return;
  }
  if(loginPrompt) loginPrompt.style.display = 'none';

  // Bouton PayPal classique (carte bancaire + solde PayPal). On exclut Apple Pay
  // ici pour l'afficher séparément, dans son propre bouton natif ci-dessous.
  paypal.Buttons(Object.assign({
    fundingSource: paypal.FUNDING.PAYPAL,
    style: { color: 'gold', shape: 'rect', label: 'paypal', height: 45 }
  }, paypalOrderConfig())).render('#paypal-button-container');

  // Bouton Apple Pay (via PayPal) : n'apparaît que pour les visiteurs sur un
  // navigateur/appareil compatible (Safari, avec une carte configurée dans Wallet).
  if(appleContainer && paypal.isFundingEligible && paypal.isFundingEligible(paypal.FUNDING.APPLEPAY)){
    paypal.Buttons(Object.assign({
      fundingSource: paypal.FUNDING.APPLEPAY,
      style: { height: 45 }
    }, paypalOrderConfig())).render('#applepay-button-container');
  }
}

function initCartCountOnly(){
  // Pour les pages sans tiroir complet (compte, collections, à propos, contact) :
  // affiche juste le nombre d'articles et redirige vers la boutique.
  const countEl = document.querySelector('.cart-count');
  const cartBtn = document.querySelector('.cart-btn');
  if(countEl) countEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
  if(cartBtn && !document.getElementById('cartDrawer')){
    cartBtn.addEventListener('click', ()=> window.location.href = 'boutique.html');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('cartDrawer')){
    initCartDrawer();
    renderCart();
    // Firebase met un instant à restaurer la session au chargement : on
    // (ré)affiche les boutons de paiement dès que l'état de connexion est connu,
    // et à chaque changement (connexion / déconnexion).
    if(typeof auth !== 'undefined'){
      auth.onAuthStateChanged(() => renderPaypalButton());
    } else {
      renderPaypalButton();
    }
  } else {
    initCartCountOnly();
  }
});
