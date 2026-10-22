import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ensureAdminUserAsync } from './adminApi';
import { DEFAULT_LOCATIONS, slugifyLocationId } from '../constants/locations';
import { diffCustomer, hasChanges } from './customerDiff';

const BATCH_CHUNK_SIZE = 400;
const MAX_STORED_DETAIL_ROWS = 800;

const normalizeLocationDoc = (id, data) => ({
  id,
  name: data?.name || id,
  customerCount: Number(data?.customerCount) || 0,
  lastImportId: data?.lastImportId || null,
  lastImportAt: data?.lastImportAt || null,
  lastImportFileName: data?.lastImportFileName || null,
  lastImportNewCount: Number(data?.lastImportNewCount) || 0,
  lastImportUpdatedCount: Number(data?.lastImportUpdatedCount) || 0,
  lastImportUnchangedCount: Number(data?.lastImportUnchangedCount) || 0,
  lastImportInvalidCount: Number(data?.lastImportInvalidCount) || 0,
  createdAt: data?.createdAt || null,
  updatedAt: data?.updatedAt || null,
});

// Customer data requires auth for reads as well as writes (see firestore.rules), so every
// lookup below waits for Firebase Auth to resolve first. Without this, a fresh page load can
// fire Firestore reads before auth.currentUser has been restored and get permission-denied
// even though the admin is, in fact, logged in.
export const listLocations = async () => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAdminUserAsync();
  const snapshot = await getDocs(collection(db, 'locations'));
  return snapshot.docs
    .map((d) => normalizeLocationDoc(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Seeds the three starter locations the first time the dashboard loads with an empty collection.
// Never overwrites existing locations, and owners can add more from the dashboard afterward.
export const ensureDefaultLocations = async () => {
  if (!db) throw new Error('Firebase is not configured.');
  const existing = await listLocations();
  if (existing.length > 0) return existing;

  const batch = writeBatch(db);
  for (const location of DEFAULT_LOCATIONS) {
    batch.set(doc(db, 'locations', location.id), {
      name: location.name,
      customerCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return listLocations();
};

export const addLocation = async (name) => {
  if (!db) throw new Error('Firebase is not configured.');
  const trimmedName = String(name || '').trim();
  if (!trimmedName) throw new Error('Location name is required.');

  const existing = await listLocations();
  const baseSlug = slugifyLocationId(trimmedName) || 'location';
  let candidate = baseSlug;
  let suffix = 2;
  const takenIds = new Set(existing.map((loc) => loc.id));
  while (takenIds.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  await setDoc(doc(db, 'locations', candidate), {
    name: trimmedName,
    customerCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: candidate, name: trimmedName };
};

export const getLocation = async (locationId) => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAdminUserAsync();
  const snap = await getDoc(doc(db, 'locations', locationId));
  if (!snap.exists()) return null;
  return normalizeLocationDoc(snap.id, snap.data());
};

export const getLocationCustomers = async (locationId) => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAdminUserAsync();
  const snapshot = await getDocs(collection(db, 'locations', locationId, 'customers'));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
};

export const getLocationImports = async (locationId) => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAdminUserAsync();
  const q = query(collection(db, 'locations', locationId, 'imports'), orderBy('uploadedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getImportRecord = async (locationId, importId) => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAdminUserAsync();
  const snap = await getDoc(doc(db, 'locations', locationId, 'imports', importId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

const trimForStorage = (list, mapFn) => {
  const mapped = list.map(mapFn);
  if (mapped.length <= MAX_STORED_DETAIL_ROWS) {
    return { items: mapped, truncated: false };
  }
  return { items: mapped.slice(0, MAX_STORED_DETAIL_ROWS), truncated: true };
};

// Parses/validates happen entirely client-side before this runs (see customerImport.js),
// so nothing here touches Firestore until the whole CSV has already passed validation.
export const syncImportToFirestore = async ({
  locationId,
  locationName,
  fileName,
  csvRecordCount,
  validRecords,
  invalidRows,
}) => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAdminUserAsync();

  const customersRef = collection(db, 'locations', locationId, 'customers');
  const existingSnap = await getDocs(customersRef);
  const existingMap = new Map(existingSnap.docs.map((d) => [d.id, d.data()]));

  const importRef = doc(collection(db, 'locations', locationId, 'imports'));
  const importId = importRef.id;

  const newCustomers = [];
  const updatedCustomers = [];
  let unchangedCount = 0;
  const writesQueue = [];

  for (const rec of validRecords) {
    const existing = existingMap.get(rec.phoneNumber);
    const customerRef = doc(db, 'locations', locationId, 'customers', rec.phoneNumber);

    if (!existing) {
      newCustomers.push(rec);
      writesQueue.push({
        ref: customerRef,
        data: {
          name: rec.name,
          phoneNumber: rec.phoneNumber,
          points: rec.points,
          visits: rec.visits,
          lastVisit: rec.lastVisit,
          spent: rec.spent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastImportId: importId,
        },
      });
      continue;
    }

    const changes = diffCustomer(existing, rec);
    if (!hasChanges(changes)) {
      unchangedCount += 1;
      continue;
    }

    updatedCustomers.push({ ...rec, changes });
    writesQueue.push({
      ref: customerRef,
      data: {
        name: rec.name,
        phoneNumber: rec.phoneNumber,
        points: rec.points,
        visits: rec.visits,
        lastVisit: rec.lastVisit,
        spent: rec.spent,
        updatedAt: serverTimestamp(),
        lastImportId: importId,
      },
    });
  }

  // Firestore batches cap at 500 ops, so large CSVs commit in sequential chunks.
  // Every row was already parsed and validated up front, so a mid-import failure
  // never leaves half-parsed data behind -- only some already-valid rows may not
  // have written yet. Re-uploading the same CSV afterward is safe and idempotent.
  for (let i = 0; i < writesQueue.length; i += BATCH_CHUNK_SIZE) {
    const chunk = writesQueue.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const item of chunk) batch.set(item.ref, item.data, { merge: true });
    await batch.commit();
  }

  const totalCustomersAfter = existingMap.size + newCustomers.length;

  const newCustomersForStorage = trimForStorage(newCustomers, (c) => ({
    phoneNumber: c.phoneNumber,
    name: c.name,
    points: c.points,
    visits: c.visits,
    lastVisit: c.lastVisit,
    spent: c.spent,
  }));
  const updatedCustomersForStorage = trimForStorage(updatedCustomers, (c) => ({
    phoneNumber: c.phoneNumber,
    name: c.name,
    changes: c.changes,
  }));
  const invalidRowsForStorage = trimForStorage(invalidRows, (r) => ({
    rowNumber: r.rowNumber,
    reason: r.reason,
  }));

  const importSummary = {
    locationId,
    locationName,
    fileName,
    uploadedAt: serverTimestamp(),
    csvRecordCount,
    newCount: newCustomers.length,
    updatedCount: updatedCustomers.length,
    unchangedCount,
    invalidCount: invalidRows.length,
    totalCustomersAfter,
    newCustomers: newCustomersForStorage.items,
    updatedCustomers: updatedCustomersForStorage.items,
    invalidRows: invalidRowsForStorage.items,
    truncatedDetails:
      newCustomersForStorage.truncated || updatedCustomersForStorage.truncated || invalidRowsForStorage.truncated,
  };

  await setDoc(importRef, importSummary);

  const locationSnap = await getDoc(doc(db, 'locations', locationId));
  await setDoc(
    doc(db, 'locations', locationId),
    {
      name: locationName,
      customerCount: totalCustomersAfter,
      updatedAt: serverTimestamp(),
      ...(locationSnap.exists() ? {} : { createdAt: serverTimestamp() }),
      lastImportId: importId,
      lastImportAt: serverTimestamp(),
      lastImportFileName: fileName,
      lastImportNewCount: newCustomers.length,
      lastImportUpdatedCount: updatedCustomers.length,
      lastImportUnchangedCount: unchangedCount,
      lastImportInvalidCount: invalidRows.length,
    },
    { merge: true }
  );

  return {
    importId,
    locationId,
    locationName,
    fileName,
    uploadedAt: new Date(),
    csvRecordCount,
    newCustomers,
    updatedCustomers,
    unchangedCount,
    invalidRows,
    totalCustomersAfter,
  };
};
