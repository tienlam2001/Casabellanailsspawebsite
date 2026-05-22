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
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

const ADMIN_TOKEN_KEY = 'adminAuthToken';
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
  ensureAdminUser(user);
  return user;
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
  await ensureAdminUserAsync();
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
    await updateDoc(doc(db, 'services', serviceDoc.id), {
      priceFrom: update.priceFrom,
      key,
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
      updatedAt: serverTimestamp(),
      ...(overwrite ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
  }

  await batch.commit();
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
  await ensureAdminUserAsync();
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
  seedServicesCollection,
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  seedGalleryCollection,
  uploadGalleryImageFile,
  uploadOfferImageFile,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  seedBlogPostsCollection,
};
