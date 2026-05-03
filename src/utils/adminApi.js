import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const ADMIN_TOKEN_KEY = 'adminAuthToken';
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const getAdminToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
};

const setAdminToken = (token) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

const ensureAdminUser = (user) => {
  if (!user?.email) throw new Error('Please sign in.');
  if (ADMIN_EMAILS.length === 0) return;
  const allowed = ADMIN_EMAILS.includes(user.email.toLowerCase());
  if (!allowed) throw new Error('Your account is not allowed as admin.');
};

const loginAdmin = async ({ username, email, password }) => {
  const nextEmail = String(email || username || '').trim();
  const credentials = await signInWithEmailAndPassword(auth, nextEmail, password);
  ensureAdminUser(credentials.user);
  const jwt = await credentials.user.getIdToken();
  setAdminToken(jwt);
  return {
    token: jwt,
    username: credentials.user.email,
    expiresInHours: 12,
  };
};

const logoutAdmin = async () => {
  await signOut(auth);
  setAdminToken(null);
};

const getWelcomeOffer = async () => {
  const snapshot = await getDoc(doc(db, 'offers', 'welcome'));
  if (!snapshot.exists()) return null;
  return snapshot.data();
};

const updateWelcomeOffer = async (offer) => {
  ensureAdminUser(auth.currentUser);
  const payload = {
    ...offer,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'offers', 'welcome'), payload, { merge: true });
  return offer;
};

const normalizeService = (item) => ({
  name: item.name,
  shortDescription: item.shortDescription,
  duration: item.duration,
  category: item.category,
  priceFrom: item.priceFrom,
  key: item.key || `${item.name}::${item.category}`,
});

const getServices = async () => {
  const snapshot = await getDocs(collection(db, 'services'));
  return snapshot.docs.map((docItem) => normalizeService({ ...docItem.data() }));
};

const updateServicePrices = async (updates) => {
  ensureAdminUser(auth.currentUser);
  const snapshot = await getDocs(collection(db, 'services'));
  const servicesByKey = new Map();
  for (const item of snapshot.docs) {
    const data = item.data();
    const key = `${String(data?.name || '').trim()}::${String(data?.category || '').trim()}`;
    servicesByKey.set(key, item);
  }

  for (const update of updates) {
    const key = `${String(update.name).trim()}::${String(update.category).trim()}`;
    const serviceDoc = servicesByKey.get(key);
    if (!serviceDoc) {
      throw new Error(`Unknown service: ${update.name} (${update.category})`);
    }
    await updateDoc(doc(db, 'services', serviceDoc.id), {
      priceFrom: update.priceFrom,
      key,
      updatedAt: serverTimestamp(),
    });
  }
  return getServices();
};

const createService = async (service) => {
  ensureAdminUser(auth.currentUser);
  const key = `${String(service.name).trim()}::${String(service.category).trim()}`;
  const existing = await getDocs(collection(db, 'services'));
  const exists = existing.docs.some((item) => {
    const data = item.data();
    const existingKey = `${String(data?.name || '').trim()}::${String(data?.category || '').trim()}`;
    return existingKey === key;
  });
  if (exists) throw new Error('Service already exists for that name and category');

  await addDoc(collection(db, 'services'), {
    name: service.name.trim(),
    shortDescription: service.shortDescription.trim(),
    duration: service.duration.trim(),
    category: service.category.trim(),
    priceFrom: service.priceFrom,
    key,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return getServices();
};

const normalizeGalleryItem = (id, item) => ({
  id,
  imageUrl: String(item?.imageUrl || '').trim(),
  alt: String(item?.alt || '').trim(),
  category: String(item?.category || '').trim(),
});

const getGalleryImages = async () => {
  const snapshot = await getDocs(collection(db, 'galleryImages'));
  return snapshot.docs
    .map((docItem) => normalizeGalleryItem(docItem.id, docItem.data()))
    .filter((item) => item.imageUrl && item.category);
};

const createGalleryImage = async (payload) => {
  ensureAdminUser(auth.currentUser);
  await addDoc(collection(db, 'galleryImages'), {
    imageUrl: String(payload.imageUrl || '').trim(),
    alt: String(payload.alt || '').trim(),
    category: String(payload.category || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return getGalleryImages();
};

const updateGalleryImage = async (id, payload) => {
  ensureAdminUser(auth.currentUser);
  await updateDoc(doc(db, 'galleryImages', id), {
    imageUrl: String(payload.imageUrl || '').trim(),
    alt: String(payload.alt || '').trim(),
    category: String(payload.category || '').trim(),
    updatedAt: serverTimestamp(),
  });
  return getGalleryImages();
};

const deleteGalleryImage = async (id) => {
  ensureAdminUser(auth.currentUser);
  await deleteDoc(doc(db, 'galleryImages', id));
  return getGalleryImages();
};

export {
  ADMIN_TOKEN_KEY,
  getAdminToken,
  setAdminToken,
  loginAdmin,
  logoutAdmin,
  getWelcomeOffer,
  updateWelcomeOffer,
  getServices,
  updateServicePrices,
  createService,
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
};
