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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
