/* ============================================================
   KOBA FITNESS — Données du site (Firestore)
   ------------------------------------------------------------
   Toutes les fonctions ci-dessous lisent/écrivent directement
   dans ta base de données Firebase. Toute modification (via
   admin.html) est donc visible instantanément par TOUS tes
   visiteurs, sur tous les appareils — plus besoin d'exporter
   ou de réhéberger quoi que ce soit.

   Nécessite firebase-config.js chargé avant ce fichier.
   ============================================================ */

async function getProducts(){
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addProduct(product){
  return db.collection('products').add(product);
}

async function updateProduct(id, data){
  return db.collection('products').doc(id).update(data);
}

async function deleteProduct(id){
  return db.collection('products').doc(id).delete();
}

async function getPromos(){
  const snapshot = await db.collection('promos').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addPromo(promo){
  return db.collection('promos').add(promo);
}

async function updatePromo(id, data){
  return db.collection('promos').doc(id).update(data);
}

async function deletePromo(id){
  return db.collection('promos').doc(id).delete();
}

async function validatePromoCode(rawCode){
  const code = (rawCode || '').trim().toUpperCase();
  if(!code) return null;
  const snapshot = await db.collection('promos')
    .where('code', '==', code)
    .where('active', '==', true)
    .limit(1)
    .get();
  if(snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function seedDefaultDataIfNeeded(){
  const productsSnap = await db.collection('products').limit(1).get();
  const promosSnap = await db.collection('promos').limit(1).get();
  const results = { products: false, promos: false };

  if(productsSnap.empty && typeof SEED_PRODUCTS !== 'undefined'){
    const batch = db.batch();
    SEED_PRODUCTS.forEach(p => {
      const ref = db.collection('products').doc();
      batch.set(ref, p);
    });
    await batch.commit();
    results.products = true;
  }

  if(promosSnap.empty && typeof SEED_PROMOS !== 'undefined'){
    const batch = db.batch();
    SEED_PROMOS.forEach(p => {
      const ref = db.collection('promos').doc();
      batch.set(ref, p);
    });
    await batch.commit();
    results.promos = true;
  }

  return results;
}

function formatPrice(n){
  return n.toFixed(2).replace('.', ',') + ' \u20ac';
}
