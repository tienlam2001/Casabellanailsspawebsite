import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Public web config for Firebase project casabellanailsspawebsite, the same
// project Operatix and the Lovely Nail site already use. Override with
// VITE_FIREBASE_* when needed. Never put a service account or admin token here.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA5Wy3Ovve7sXFeDwYDPCxKfflz5YWVzmU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'casabellanailsspawebsite.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'casabellanailsspawebsite',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'casabellanailsspawebsite.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '741769582993',
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = isConfigured ? getAuth(app) : null;
const db = isConfigured ? getFirestore(app) : null;
const storage = isConfigured ? getStorage(app) : null;

export { app, auth, db, storage };
