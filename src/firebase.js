import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA5Wy3Ovve7sXFeDwYDPCxKfflz5YWVzmU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'casabellanailsspawebsite.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'casabellanailsspawebsite',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'casabellanailsspawebsite.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '741769582993',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:741769582993:web:a33134734d20ae1a102230',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-M87XDLKPRW',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
