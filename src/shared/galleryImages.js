// Public galleryImages documents.
// Query: location in ["casabella", "all"], isPublic == true, orderBy sortOrder.
// Older documents use alt, salonname, and a same-site imageUrl and have no
// isPublic, location, or sortOrder. Those still normalize for display.

import { isCasabellaLocation, safeAssetUrl } from './salonLocation.js';

export const GALLERY_LOCATIONS = ['casabella', 'all'];

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeGalleryImage = (id, record) => {
  if (record?.isPublic === false) return null;
  const location = text(record?.location).toLowerCase();
  const salonname = text(record?.salonname || record?.salonName);
  const locationAllowed = GALLERY_LOCATIONS.includes(location);
  const legacyCasabella = !location && isCasabellaLocation(salonname);
  if (!locationAllowed && !legacyCasabella) return null;
  if (location === 'casabella' && salonname && !isCasabellaLocation(salonname)) return null;

  const imageUrl = safeAssetUrl(record?.imageUrl || record?.src);
  if (!imageUrl) return null;
  const caption = text(record?.caption) || text(record?.alt) || text(record?.title);
  const tag = Array.isArray(record?.tags) ? text(record.tags[0]) : '';
  const category = text(record?.category) || tag || 'Salon';
  const sortOrder = Number(record?.sortOrder);
  return {
    id,
    imageUrl,
    src: imageUrl,
    alt: caption || `${category} at Casabella Nail & Spa`,
    caption,
    category,
    location: location || 'casabella',
    salonname,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : null,
  };
};

export const sortGalleryImages = (images) => [...images].sort((first, second) => {
  const firstOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const secondOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;
  return firstOrder - secondOrder
    || String(first.category).localeCompare(String(second.category))
    || String(first.id).localeCompare(String(second.id));
});
