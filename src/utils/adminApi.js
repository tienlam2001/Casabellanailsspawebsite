import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import {
  CASABELLA,
  isCurrentPromotion,
  localDateValue,
  normalizeOfferDocument,
  recordMatchesCasabella,
  safeAssetUrl,
} from '../shared/salonLocation';

const ADMIN_TOKEN_KEY = 'adminAuthToken';
const getAdminToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
};

const setAdminToken = (active) => {
  if (typeof window === 'undefined') return;
  if (!active) {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_TOKEN_KEY, 'active');
};

const getFriendlyAuthError = (error) => {
  if (error?.message === 'This account is not authorized to manage the website.') {
    return error.message;
  }

  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.';
    case 'auth/unauthorized-domain':
      return 'This website domain is not authorized in Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'Network error while signing in. Please check your connection and try again.';
    default:
      return error?.message || 'Login failed. Please try again.';
  }
};

const ensureAdminUser = async (user, forceRefresh = false) => {
  if (!user?.email) throw new Error('Please sign in.');
  const tokenResult = await user.getIdTokenResult(forceRefresh);
  if (tokenResult.claims.admin !== true) {
    throw new Error('This account is not authorized to manage the website.');
  }
};

const getResolvedAuthUser = async () => {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user || null);
    });
  });
};

const ensureAdminUserAsync = async () => {
  const user = await getResolvedAuthUser();
  await ensureAdminUser(user);
  return user;
};

const loginAdmin = async ({ username, email, password }) => {
  if (!auth) {
    throw new Error('Firebase is not configured for admin login.');
  }
  const nextEmail = String(email || username || '').trim();
  if (!nextEmail || !password) {
    throw new Error('Enter both admin email and password.');
  }

  let credentials;
  try {
    credentials = await signInWithEmailAndPassword(auth, nextEmail, password);
  } catch (error) {
    throw new Error(getFriendlyAuthError(error));
  }

  try {
    await ensureAdminUser(credentials.user, true);
  } catch (error) {
    await signOut(auth);
    throw new Error(getFriendlyAuthError(error));
  }
  setAdminToken(true);
  return {
    token: true,
    username: credentials.user.email,
    expiresInHours: 12,
  };
};

const logoutAdmin = async () => {
  await signOut(auth);
  setAdminToken(null);
};

const requireDb = () => {
  if (!db) {
    throw new Error('Firebase is not configured. Add the public VITE_FIREBASE_* environment variables.');
  }
  return db;
};

const casabellaFields = () => ({
  salonname: CASABELLA.salonName,
  location: CASABELLA.locationKey,
});

const getWelcomeOffer = async () => {
  const database = requireDb();
  const today = localDateValue();
  const snapshot = await getDocs(collection(database, 'offers'));
  const offers = snapshot.docs
    .map((docItem) => normalizeOfferDocument(docItem.id, docItem.data(), today))
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  if (!offers.length) return null;

  const slides = offers.flatMap((offer) => offer.slides);
  return {
    location: CASABELLA.locationKey,
    slideDurationMs: offers[0].slideDurationMs,
    slides,
    badge: slides[0]?.badge || '',
    kicker: slides[0]?.kicker || '',
    title: slides[0]?.title || '',
    message: slides[0]?.message || '',
    ctaLabel: slides[0]?.ctaLabel || 'View More Details',
    ctaPath: slides[0]?.ctaPath || '/promotions',
    imageUrl: slides[0]?.imageUrl || '',
  };
};

const normalizePromotionReminderSignup = (id, item) => ({
  id,
  firstName: String(item?.firstName || '').trim(),
  lastName: String(item?.lastName || '').trim(),
  email: String(item?.email || '').trim(),
  phone: String(item?.phone || '').trim(),
  smsConsent: item?.smsConsent === true,
  consentVersion: String(item?.consentVersion || ''),
  optInSource: String(item?.optInSource || ''),
  createdAt: item?.createdAt?.toDate ? item.createdAt.toDate().toISOString() : '',
});

const createPromotionReminderSignup = async (payload) => {
  const firstName = String(payload?.firstName || '').trim();
  const lastName = String(payload?.lastName || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const phone = String(payload?.phone || '').trim();
  const smsConsent = payload?.smsConsent === true;

  const legacySignup = {
    firstName,
    lastName,
    email,
    phone,
    smsConsent,
    consentVersion: 'sms-promotion-reminders-2026-10-09',
    optInSource: 'website-promotion-reminders-form',
    createdAt: serverTimestamp(),
  };
  const signup = {
    ...legacySignup,
    name: `${firstName} ${lastName}`.trim(),
    ...casabellaFields(),
    source: CASABELLA.source,
    source_type: 'promotion-signup',
  };

  try {
    await addDoc(collection(requireDb(), 'promotionReminderSignups'), signup);
  } catch (error) {
    if (error?.code !== 'permission-denied') throw error;
    await addDoc(collection(requireDb(), 'promotionReminderSignups'), legacySignup);
  }
};

const getPromotionReminderSignups = async () => {
  await ensureAdminUserAsync();
  const snapshot = await getDocs(query(collection(db, 'promotionReminderSignups'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docItem) => normalizePromotionReminderSignup(docItem.id, docItem.data()));
};

const updateWelcomeOffer = async (offer) => {
  await ensureAdminUserAsync();
  const payload = {
    ...offer,
    ...casabellaFields(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(requireDb(), 'offers', 'welcome'), payload, { merge: true });
  return offer;
};

const normalizeService = (item) => ({
  name: item.name,
  shortDescription: item.shortDescription,
  duration: item.duration,
  category: item.category,
  priceFrom: item.priceFrom,
  key: item.key || `${item.name}::${item.category}`,
  salonname: item.salonname || '',
  location: item.location || '',
  active: item.active !== false,
});

const getServices = async () => {
  const snapshot = await getDocs(collection(requireDb(), 'services'));
  return snapshot.docs
    .map((docItem) => normalizeService(docItem.data()))
    .filter((item) => item.name && item.active && recordMatchesCasabella(item, { allowUnlabeled: true }));
};

const updateServicePrices = async (updates) => {
  await ensureAdminUserAsync();
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
    await updateDoc(doc(requireDb(), 'services', serviceDoc.id), {
      priceFrom: update.priceFrom,
      key,
      ...casabellaFields(),
      updatedAt: serverTimestamp(),
    });
  }
  return getServices();
};

const createService = async (service) => {
  await ensureAdminUserAsync();
  const key = `${String(service.name).trim()}::${String(service.category).trim()}`;
  const existing = await getDocs(collection(db, 'services'));
  const exists = existing.docs.some((item) => {
    const data = item.data();
    const existingKey = `${String(data?.name || '').trim()}::${String(data?.category || '').trim()}`;
    return existingKey === key;
  });
  if (exists) throw new Error('Service already exists for that name and category');

  await addDoc(collection(requireDb(), 'services'), {
    name: service.name.trim(),
    shortDescription: service.shortDescription.trim(),
    duration: service.duration.trim(),
    category: service.category.trim(),
    priceFrom: service.priceFrom,
    key,
    ...casabellaFields(),
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return getServices();
};

const seedServicesCollection = async (services, { overwrite = false } = {}) => {
  await ensureAdminUserAsync();
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error('No services provided for seeding.');
  }

  const existingSnapshot = await getDocs(collection(db, 'services'));
  if (!overwrite && !existingSnapshot.empty) {
    return getServices();
  }

  const batch = writeBatch(db);
  if (overwrite) {
    for (const item of existingSnapshot.docs) {
      batch.delete(doc(db, 'services', item.id));
    }
  }

  for (const service of services) {
    const name = String(service?.name || '').trim();
    const category = String(service?.category || '').trim();
    const shortDescription = String(service?.shortDescription || '').trim();
    const duration = String(service?.duration || '').trim();
    const priceFrom = Number(service?.priceFrom);
    if (!name || !category || !shortDescription || !duration || !Number.isFinite(priceFrom)) {
      continue;
    }

    const key = `${name}::${category}`;
    const ref = doc(db, 'services', encodeURIComponent(key));
    batch.set(ref, {
      name,
      shortDescription,
      duration,
      category,
      priceFrom,
      key,
      ...casabellaFields(),
      active: true,
      updatedAt: serverTimestamp(),
      ...(overwrite ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
  }

  await batch.commit();
  return getServices();
};

const normalizeGalleryItem = (id, item) => ({
  id,
  imageUrl: safeAssetUrl(item?.imageUrl),
  alt: String(item?.alt || item?.title || '').trim(),
  category: String(item?.category || (Array.isArray(item?.tags) ? item.tags[0] : '') || 'Salon').trim(),
  salonname: String(item?.salonname || '').trim(),
  location: String(item?.location || '').trim(),
});

const galleryDocs = (snapshot, allowUnlabeled) => snapshot.docs
  .map((docItem) => normalizeGalleryItem(docItem.id, docItem.data()))
  .filter((item) => item.imageUrl && recordMatchesCasabella(item, { allowUnlabeled }));

const getGalleryImages = async () => {
  const database = requireDb();
  const snapshot = await getDocs(collection(database, 'galleryImages'));
  const images = galleryDocs(snapshot, true);
  try {
    const managed = await getDocs(collection(database, 'gallery'));
    const seen = new Set(images.map((item) => item.imageUrl));
    for (const item of galleryDocs(managed, false)) {
      if (seen.has(item.imageUrl)) continue;
      seen.add(item.imageUrl);
      images.push(item);
    }
  } catch (error) {
    if (error?.code !== 'permission-denied') throw error;
  }
  return images;
};

const createGalleryImage = async (payload) => {
  await ensureAdminUserAsync();
  await addDoc(collection(requireDb(), 'galleryImages'), {
    imageUrl: String(payload.imageUrl || '').trim(),
    alt: String(payload.alt || '').trim(),
    category: String(payload.category || '').trim(),
    ...casabellaFields(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return getGalleryImages();
};

const updateGalleryImage = async (id, payload) => {
  await ensureAdminUserAsync();
  await updateDoc(doc(db, 'galleryImages', id), {
    imageUrl: String(payload.imageUrl || '').trim(),
    alt: String(payload.alt || '').trim(),
    category: String(payload.category || '').trim(),
    updatedAt: serverTimestamp(),
  });
  return getGalleryImages();
};

const deleteGalleryImage = async (id) => {
  await ensureAdminUserAsync();
  await deleteDoc(doc(db, 'galleryImages', id));
  return getGalleryImages();
};

const seedGalleryCollection = async (items, { overwrite = false } = {}) => {
  await ensureAdminUserAsync();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No gallery items provided for seeding.');
  }

  const existingSnapshot = await getDocs(collection(db, 'galleryImages'));
  if (!overwrite && !existingSnapshot.empty) {
    return getGalleryImages();
  }

  const batch = writeBatch(db);
  if (overwrite) {
    for (const item of existingSnapshot.docs) {
      batch.delete(doc(db, 'galleryImages', item.id));
    }
  }

  let index = 0;
  for (const item of items) {
    const imageUrl = String(item?.imageUrl || item?.src || '').trim();
    const alt = String(item?.alt || '').trim();
    const category = String(item?.category || '').trim();
    if (!imageUrl || !category) continue;

    const docId = `seed-${String(category).toLowerCase()}-${String(index).padStart(4, '0')}`;
    index += 1;
    batch.set(doc(db, 'galleryImages', docId), {
      imageUrl,
      alt,
      category,
      ...casabellaFields(),
      updatedAt: serverTimestamp(),
      ...(overwrite ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
  }

  await batch.commit();
  return getGalleryImages();
};

const normalizeBlogPost = (id, item) => ({
  id,
  slug: String(item?.slug || '').trim(),
  title: String(item?.title || '').trim(),
  date: String(item?.date || '').trim(),
  excerpt: String(item?.excerpt || '').trim(),
  content: String(item?.content || '').trim(),
  tags: Array.isArray(item?.tags)
    ? item.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [],
});

const getBlogPosts = async () => {
  const snapshot = await getDocs(collection(db, 'blogPosts'));
  return snapshot.docs
    .map((docItem) => normalizeBlogPost(docItem.id, docItem.data()))
    .filter((item) => item.slug && item.title && item.date);
};

const createBlogPost = async (payload) => {
  await ensureAdminUserAsync();
  const slug = String(payload?.slug || '').trim();
  if (!slug) throw new Error('Slug is required.');
  const existing = await getDocs(collection(db, 'blogPosts'));
  const exists = existing.docs.some((item) => String(item.data()?.slug || '').trim() === slug);
  if (exists) throw new Error('A blog post with this slug already exists.');

  await addDoc(collection(db, 'blogPosts'), {
    slug,
    title: String(payload.title || '').trim(),
    date: String(payload.date || '').trim(),
    excerpt: String(payload.excerpt || '').trim(),
    content: String(payload.content || '').trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return getBlogPosts();
};

const updateBlogPost = async (id, payload) => {
  await ensureAdminUserAsync();
  const slug = String(payload?.slug || '').trim();
  if (!slug) throw new Error('Slug is required.');
  const existing = await getDocs(collection(db, 'blogPosts'));
  const exists = existing.docs.some(
    (item) => item.id !== id && String(item.data()?.slug || '').trim() === slug
  );
  if (exists) throw new Error('Another blog post already uses this slug.');

  await updateDoc(doc(db, 'blogPosts', id), {
    slug,
    title: String(payload.title || '').trim(),
    date: String(payload.date || '').trim(),
    excerpt: String(payload.excerpt || '').trim(),
    content: String(payload.content || '').trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    updatedAt: serverTimestamp(),
  });
  return getBlogPosts();
};

const deleteBlogPost = async (id) => {
  await ensureAdminUserAsync();
  await deleteDoc(doc(db, 'blogPosts', id));
  return getBlogPosts();
};

const normalizePromotion = (id, item, source = 'promotions') => ({
  id,
  title: String(item?.title || '').trim(),
  description: String(item?.description || item?.message || '').trim(),
  offer: String(item?.offer || item?.badge || item?.kicker || '').trim(),
  startDate: String(item?.startDate || '').trim(),
  endDate: String(item?.endDate || '').trim(),
  business: String(item?.business || CASABELLA.businessName).trim(),
  imageUrl: safeAssetUrl(item?.imageUrl),
  isActive: item?.isActive !== false && item?.enabled !== false && item?.active !== false,
  salonname: String(item?.salonname || '').trim(),
  location: String(item?.location || '').trim(),
  source,
  readOnly: source === 'offers',
});

const getPromotions = async () => {
  const snapshot = await getDocs(collection(requireDb(), 'promotions'));
  return snapshot.docs
    .map((docItem) => normalizePromotion(docItem.id, docItem.data()))
    .filter((item) => (
      item.title
      && item.description
      && item.startDate
      && item.endDate
      && recordMatchesCasabella(item, { allowUnlabeled: true })
    ))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
};

const offersAsPromotions = async () => {
  const offer = await getWelcomeOffer();
  if (!offer?.slides?.length) return [];
  return offer.slides.map((slide, index) => normalizePromotion(`offers-${index}`, {
    ...slide,
    description: slide.message,
    offer: slide.badge || slide.kicker,
    business: CASABELLA.businessName,
    isActive: true,
    location: CASABELLA.locationKey,
    salonname: CASABELLA.salonName,
  }, 'offers')).filter((item) => item.title);
};

const loadCasabellaSpecials = async () => {
  const [offerResult, promotionResult] = await Promise.allSettled([
    offersAsPromotions(),
    getPromotions(),
  ]);
  const items = [];
  if (offerResult.status === 'fulfilled') items.push(...offerResult.value);
  if (promotionResult.status === 'fulfilled') items.push(...promotionResult.value);
  if (!items.length && offerResult.status === 'rejected' && promotionResult.status === 'rejected') {
    throw offerResult.reason;
  }
  return {
    items,
    partialError: offerResult.status === 'rejected' || promotionResult.status === 'rejected',
  };
};

const promotionPayload = (payload) => ({
  title: String(payload?.title || '').trim(),
  description: String(payload?.description || '').trim(),
  offer: String(payload?.offer || '').trim(),
  startDate: String(payload?.startDate || '').trim(),
  endDate: String(payload?.endDate || '').trim(),
  business: String(payload?.business || CASABELLA.businessName).trim(),
  imageUrl: String(payload?.imageUrl || '').trim(),
  isActive: payload?.isActive !== false,
  ...casabellaFields(),
});

const createPromotion = async (payload) => {
  await ensureAdminUserAsync();
  await addDoc(collection(db, 'promotions'), {
    ...promotionPayload(payload),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return (await loadCasabellaSpecials()).items;
};

const updatePromotion = async (id, payload) => {
  await ensureAdminUserAsync();
  await updateDoc(doc(db, 'promotions', id), {
    ...promotionPayload(payload),
    updatedAt: serverTimestamp(),
  });
  return (await loadCasabellaSpecials()).items;
};

const deletePromotion = async (id) => {
  await ensureAdminUserAsync();
  await deleteDoc(doc(db, 'promotions', id));
  return (await loadCasabellaSpecials()).items;
};

const seedBlogPostsCollection = async (posts, { overwrite = false } = {}) => {
  await ensureAdminUserAsync();
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('No blog posts provided for seeding.');
  }

  const existing = await getDocs(collection(db, 'blogPosts'));
  if (!overwrite && !existing.empty) return getBlogPosts();

  const batch = writeBatch(db);
  if (overwrite) {
    for (const item of existing.docs) batch.delete(doc(db, 'blogPosts', item.id));
  }

  let index = 0;
  for (const post of posts) {
    const slug = String(post?.slug || '').trim();
    const title = String(post?.title || '').trim();
    const date = String(post?.date || '').trim();
    const excerpt = String(post?.excerpt || '').trim();
    const content = String(post?.content || '').trim();
    const tags = Array.isArray(post?.tags)
      ? post.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [];
    if (!slug || !title || !date || !excerpt || !content) continue;

    const docId = `seed-${String(index).padStart(4, '0')}-${encodeURIComponent(slug)}`;
    index += 1;
    batch.set(
      doc(db, 'blogPosts', docId),
      {
        slug,
        title,
        date,
        excerpt,
        content,
        tags,
        updatedAt: serverTimestamp(),
        ...(overwrite ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );
  }

  await batch.commit();
  return getBlogPosts();
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to decode image file.'));
    img.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image conversion failed.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });

const optimizeImageToWebp = async (file) => {
  const dataUrl = await fileToDataUrl(file);
  const image = await loadImageElement(dataUrl);
  const maxEdge = 1920;
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to process image.');
  ctx.drawImage(image, 0, 0, width, height);

  const webpBlob = await canvasToBlob(canvas, 'image/webp', 0.82);
  const fileName = file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '-').toLowerCase();
  return new File([webpBlob], `${fileName}.webp`, { type: 'image/webp' });
};

const uploadGalleryImageFile = async (file, category = 'Nails') => {
  await ensureAdminUserAsync();
  if (!(file instanceof File)) {
    throw new Error('Please choose an image file first.');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP files are allowed.');
  }

  const optimizedFile = await optimizeImageToWebp(file);
  const safeName = optimizedFile.name.replace(/\s+/g, '-').toLowerCase();
  const path = `gallery/${String(category || 'Nails').toLowerCase()}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, optimizedFile, { contentType: optimizedFile.type });
  return getDownloadURL(storageRef);
};

const createWebsiteLead = async (payload) => {
  const name = String(payload?.name || '').trim();
  const phone = String(payload?.phone || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const sourceType = payload?.sourceType === 'booking' ? 'booking' : 'contact';
  const message = String(payload?.message || '').trim() || (sourceType === 'booking' ? 'Booking request' : '');
  const lead = {
    name,
    phone,
    email,
    message,
    ...casabellaFields(),
    source: CASABELLA.source,
    source_type: sourceType,
    createdAt: serverTimestamp(),
  };
  if (sourceType === 'booking') {
    const preferredTime = String(payload?.preferredTime || '').trim();
    lead.preferredDate = String(payload?.preferredDate || '').trim();
    lead.preferredTime = preferredTime.length > 5 ? preferredTime.slice(0, 5) : preferredTime;
    lead.serviceCategory = String(payload?.serviceCategory || '').trim();
  }
  await addDoc(collection(requireDb(), 'websiteLeads'), lead);
};

const uploadOfferImageFile = async (file) => {
  await ensureAdminUserAsync();
  if (!(file instanceof File)) {
    throw new Error('Please choose an image file first.');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP files are allowed.');
  }

  const optimizedFile = await optimizeImageToWebp(file);
  const safeName = optimizedFile.name.replace(/\s+/g, '-').toLowerCase();
  const path = `offers/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, optimizedFile, { contentType: optimizedFile.type });
  return getDownloadURL(storageRef);
};

const uploadPromotionImageFile = async (file) => {
  await ensureAdminUserAsync();
  if (!(file instanceof File)) {
    throw new Error('Please choose an image file first.');
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP files are allowed.');
  }

  const optimizedFile = await optimizeImageToWebp(file);
  const safeName = optimizedFile.name.replace(/\s+/g, '-').toLowerCase();
  const path = `promotions/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, optimizedFile, { contentType: optimizedFile.type });
  return getDownloadURL(storageRef);
};

export {
  ADMIN_TOKEN_KEY,
  getAdminToken,
  setAdminToken,
  loginAdmin,
  logoutAdmin,
  getWelcomeOffer,
  loadCasabellaSpecials,
  isCurrentPromotion,
  localDateValue,
  createWebsiteLead,
  createPromotionReminderSignup,
  getPromotionReminderSignups,
  updateWelcomeOffer,
  getServices,
  updateServicePrices,
  createService,
  seedServicesCollection,
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  seedGalleryCollection,
  uploadGalleryImageFile,
  uploadOfferImageFile,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  uploadPromotionImageFile,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  seedBlogPostsCollection,
};
