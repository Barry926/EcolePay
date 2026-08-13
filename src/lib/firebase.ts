/** STYLE SCOLÉA — Ce module ne rend aucune interface. Il centralise la connexion à Firebase utilisée par l’interface « Cahier de direction contemporain ». */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyArTv5BSZLkhiOHyNluIYG5bsW11WoS8Dk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ecolepay-77447.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ecolepay-77447',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ecolepay-77447.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1004024394734',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1004024394734:web:c67a87a73f95a60343d4ff',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

