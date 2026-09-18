/* ============================================================
   KOBA FITNESS — Rendu dynamique des grilles produit
   Nécessite shop-data.js et cart.js chargés avant ce fichier.
   ============================================================ */

function productCardHTML(p){
  const tagHTML = p.tag ? `<span class="tag">${p.tag}</span>` : '';
  return `
    <div class="card" data-category="${p.category}">
      <div class="card-photo">${tagHTML}<img src="${p.image}" alt="${p.name} - ${p.variant}"></div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-variant">${p.variant}</div>
        <div class="card-bottom">
          <span class="card-price">${formatPrice(p.price)}</span>
          <button class="add-btn" data-name="${p.name} - ${p.variant}" data-price="${p.price}" aria-label="Ajouter au panier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L4 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

async function renderProductGrid(containerId, options){
  options = options || {};
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '<p style="color:var(--grey-dim);grid-column:1/-1;text-align:center;padding:40px 0;">Chargement des produits...</p>';
  try{
    let products = await getProducts();
    if(options.featuredOnly) products = products.filter(p => p.featured);
    if(products.length === 0){
      container.innerHTML = '<p style="color:var(--grey-dim);grid-column:1/-1;text-align:center;padding:40px 0;">Aucun produit pour le moment.</p>';
      return;
    }
    container.innerHTML = products.map(productCardHTML).join('');
    wireAddButtons(container);
  } catch(err){
    console.error(err);
    container.innerHTML = '<p style="color:var(--red);grid-column:1/-1;text-align:center;padding:40px 0;">Impossible de charger les produits pour le moment.</p>';
  }
}

function wireAddButtons(scope){
  scope.querySelectorAll('.add-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
      if(window.kobaOpenCart) window.kobaOpenCart();
    });
  });
}

function initShopTabs(containerId){
  const container = document.getElementById(containerId);
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      if(!container) return;
      container.querySelectorAll('.card').forEach(card=>{
        const cats = card.dataset.category || '';
        card.classList.toggle('hidden', filter !== 'tous' && !cats.includes(filter));
      });
    });
  });
}
