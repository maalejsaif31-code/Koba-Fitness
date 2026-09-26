/* ============================================================
   KOBA FITNESS — Rendu dynamique des grilles produit
   Nécessite shop-data.js et cart.js chargés avant ce fichier.
   Chaque produit peut avoir plusieurs photos (champ "images",
   tableau) ; on garde une compatibilité avec l'ancien champ
   "image" (une seule photo) pour les produits déjà existants.
   ============================================================ */

/* ============================================================
   KOBA FITNESS — Rendu dynamique des grilles produit
   Nécessite shop-data.js et cart.js chargés avant ce fichier.
   Chaque produit peut avoir plusieurs photos (champ "images",
   tableau) ; on garde une compatibilité avec l'ancien champ
   "image" (une seule photo) pour les produits déjà existants.
   ============================================================ */

const KOBA_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

function productImages(p){
  if(Array.isArray(p.images) && p.images.length > 0) return p.images;
  if(p.image) return [p.image];
  return [];
}

function productCardHTML(p){
  const tagHTML = p.tag ? `<span class="tag">${p.tag}</span>` : '';
  const images = productImages(p);

  const imgsHTML = images.map((src, i) =>
    `<img src="${src}" class="${i === 0 ? 'active' : ''}" data-idx="${i}" alt="${p.name} - ${p.variant} (${i + 1}/${images.length})">`
  ).join('');

  const dotsHTML = images.length > 1
    ? `<div class="card-dots">${images.map((_, i) =>
        `<button type="button" class="dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Photo ${i + 1}"></button>`
      ).join('')}</div>`
    : '';

  const arrowsHTML = images.length > 1
    ? `<button type="button" class="photo-arrow prev" aria-label="Photo précédente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
       <button type="button" class="photo-arrow next" aria-label="Photo suivante"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>`
    : '';

  const sizesHTML = `
    <div class="size-select">
      ${KOBA_SIZES.map(s => `<button type="button" class="size-btn" data-size="${s}">${s}</button>`).join('')}
    </div>
    <p class="size-error">Choisis une taille avant d'ajouter au panier.</p>`;

  return `
    <div class="card" data-category="${p.category}">
      <div class="card-photo">
        ${tagHTML}
        <div class="card-photo-slider">${imgsHTML}</div>
        ${arrowsHTML}
        ${dotsHTML}
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-variant">${p.variant}</div>
        ${sizesHTML}
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
    wirePhotoDots(container);
  } catch(err){
    console.error(err);
    container.innerHTML = '<p style="color:var(--red);grid-column:1/-1;text-align:center;padding:40px 0;">Impossible de charger les produits pour le moment.</p>';
  }
}

function wireAddButtons(scope){
  scope.querySelectorAll('.add-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.card');
      const sizeSelect = card ? card.querySelector('.size-select') : null;

      if(sizeSelect){
        const activeBtn = sizeSelect.querySelector('.size-btn.active');
        if(!activeBtn){
          sizeSelect.classList.add('error');
          card.querySelector('.size-error').classList.add('show');
          sizeSelect.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }
        addToCart(btn.dataset.name + ' - Taille ' + activeBtn.dataset.size, parseFloat(btn.dataset.price));
      } else {
        addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
      }

      if(window.kobaOpenCart) window.kobaOpenCart();
    });
  });

  scope.querySelectorAll('.size-btn').forEach(sizeBtn=>{
    sizeBtn.addEventListener('click', ()=>{
      const sizeSelect = sizeBtn.closest('.size-select');
      sizeSelect.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('active', b === sizeBtn));
      sizeSelect.classList.remove('error');
      sizeSelect.closest('.card-body').querySelector('.size-error').classList.remove('show');
    });
  });
}

function wirePhotoDots(scope){
  scope.querySelectorAll('.card-photo').forEach(photoEl=>{
    const dots = photoEl.querySelectorAll('.dot');
    const imgs = photoEl.querySelectorAll('.card-photo-slider img');
    if(imgs.length <= 1) return;

    function goTo(idx){
      idx = ((idx % imgs.length) + imgs.length) % imgs.length; // boucle
      dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.idx) === idx));
      imgs.forEach(img => img.classList.toggle('active', parseInt(img.dataset.idx) === idx));
    }

    dots.forEach(dot=>{
      dot.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        goTo(parseInt(dot.dataset.idx));
      });
    });

    const prevBtn = photoEl.querySelector('.photo-arrow.prev');
    const nextBtn = photoEl.querySelector('.photo-arrow.next');
    if(prevBtn){
      prevBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const current = [...dots].findIndex(d => d.classList.contains('active'));
        goTo(current - 1);
      });
    }
    if(nextBtn){
      nextBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const current = [...dots].findIndex(d => d.classList.contains('active'));
        goTo(current + 1);
      });
    }

    // Toucher/cliquer directement sur la photo : moitié gauche = précédente, moitié droite = suivante.
    const slider = photoEl.querySelector('.card-photo-slider');
    if(slider){
      slider.style.cursor = 'pointer';
      slider.addEventListener('click', (e)=>{
        const rect = slider.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const current = [...dots].findIndex(d => d.classList.contains('active'));
        if(tapX < rect.width / 2){
          goTo(current - 1);
        } else {
          goTo(current + 1);
        }
      });
    }
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
