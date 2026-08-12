import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase avec variables d'environnement Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyArTv5BSZLkhiOHyNluIYG5bsW11WoS8Dk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecolepay-77447.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecolepay-77447",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecolepay-77447.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1004024394734",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1004024394734:web:c67a87a73f95a60343d4ff"
};

// Vérification de la configuration en production
if (import.meta.env.PROD && !firebaseConfig.apiKey) {
  console.error("ERREUR CRITIQUE : Les variables d'environnement Firebase (VITE_FIREBASE_*) sont manquantes dans votre déploiement Vercel.");
}

// Initialisation unique de l'application Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Fournisseurs d'Authentification
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const emailProvider = new EmailAuthProvider();

export default app;
