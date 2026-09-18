/* ============================================================
   KOBA FITNESS — Configuration Firebase
   Ce fichier initialise la connexion à ta base de données
   Firestore et à l'authentification admin.
   Nécessite les scripts Firebase (compat) chargés AVANT ce fichier :
     firebase-app-compat.js
     firebase-firestore-compat.js
     firebase-auth-compat.js
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBBAz4v1OOHjQgseII04sgDuJZoVUZ7RVc",
  authDomain: "koba-fitness.firebaseapp.com",
  projectId: "koba-fitness",
  storageBucket: "koba-fitness.firebasestorage.app",
  messagingSenderId: "716452609196",
  appId: "1:716452609196:web:0a40b3117059350eeaf309",
  measurementId: "G-DQLM4DVR36"
};

// Initialisation des propriétés sur l'objet global window
window.db = null;
window.auth = null;
window.kobaFirebaseReady = false;
window.kobaFirebaseError = null;

try {
  if (typeof firebase === 'undefined') {
    throw new Error("Le SDK Firebase ne s'est pas chargé (problème réseau, bloqueur de scripts, ou fichier manquant).");
  }

  // Évite la re-initialisation si Firebase est déjà prêt
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Déclaration explicite en portées globale et locale
  var db = firebase.firestore();
  var auth = firebase.auth();

  window.db = db;
  window.auth = auth;
  window.kobaFirebaseReady = true;
} catch (err) {
  console.error('Erreur d\'initialisation Firebase:', err);
  window.kobaFirebaseError = err.message || String(err);
}
