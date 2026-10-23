// Location matching follows Operatix: lowercase, drop "and/spa/nail/nails",
// then compare the remaining words. Casabella, "Casabella Nails And Spa",
// and "Casabella Nail & Spa - Oviedo" all resolve to this salon.
// Lovely Nail & Spa and Ecco Nails do not.

export const CASABELLA = {
  locationKey: 'casabella',
  salonName: 'Casabella Nails And Spa',
  businessName: 'Casabella Nail & Spa',
  source: 'casabellanailspaoviedo.com',
};

const LOCATION_STOP_WORDS = new Set(['and', 'spa', 'nail', 'nails']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const locationToken = (value) => String(value || '')
  .toLowerCase()
  .replace(/&/g, ' ')
  .split(/[^a-z0-9]+/)
  .filter((token) => token && !LOCATION_STOP_WORDS.has(token))
  .join(' ');

export const isCasabellaLocation = (value) => {
  const token = locationToken(value);
  return token === CASABELLA.locationKey || token.startsWith(`${CASABELLA.locationKey} `);
};

export const recordMatchesCasabella = (record, { allowUnlabeled = false } = {}) => {
  const location = String(record?.location || '').trim();
  const salon = String(record?.salonname || record?.salonName || '').trim();
  if (location || salon) {
    if (location && !isCasabellaLocation(location)) return false;
    if (salon && !isCasabellaLocation(salon)) return false;
    return true;
  }
  const business = String(record?.business || '').trim();
  if (business) return isCasabellaLocation(business);
  return allowUnlabeled;
};

export const offerDocumentMatchesCasabella = (id, record) => {
  if (recordMatchesCasabella(record, { allowUnlabeled: false })) return true;
  const location = String(record?.location || '').trim();
  const salon = String(record?.salonname || record?.salonName || '').trim();
  const business = String(record?.business || '').trim();
  if (location || salon || business) return false;
  return id === 'welcome' || id === 'casabella';
};

export const localDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasDate = (value) => DATE_PATTERN.test(String(value || '').trim());

export const isExplicitlyInactive = (record) => (
  record?.enabled === false || record?.isActive === false || record?.active === false
);

export const isWithinDateWindow = (record, today) => {
  const start = String(record?.startDate || '').trim();
  const end = String(record?.endDate || '').trim();
  if (hasDate(start) && start > today) return false;
  if (hasDate(end) && end < today) return false;
  return true;
};

export const isOfferActive = (record, today) => (
  !isExplicitlyInactive(record) && isWithinDateWindow(record, today)
);

export const isCurrentPromotion = (promotion, today) => (
  Boolean(promotion?.isActive) && isWithinDateWindow(promotion, today)
);

export const publicImageUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};

export const safeAssetUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('//') || raw.includes('\\')) return '';
  if (raw.startsWith('/') && !raw.includes('://')) return raw;
  return publicImageUrl(raw);
};

export const safeInternalPath = (value, fallback) => {
  const path = String(value || '').trim();
  if (path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !path.includes('://')) {
    return path;
  }
  return fallback;
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeOfferSlide = (fields, fallback = {}, fallbackPath = '/promotions') => {
  const title = text(fields?.title) || text(fallback.title);
  if (!title) return null;
  return {
    badge: text(fields?.badge) || text(fallback.badge),
    kicker: text(fields?.kicker) || text(fallback.kicker),
    title,
    message: text(fields?.message) || text(fallback.message),
    imageUrl: safeAssetUrl(fields?.imageUrl) || safeAssetUrl(fallback.imageUrl),
    ctaLabel: text(fields?.ctaLabel) || text(fallback.ctaLabel) || 'View More Details',
    ctaPath: safeInternalPath(fields?.ctaPath || fallback.ctaPath, fallbackPath),
  };
};

export const normalizeOfferDocument = (id, record, today) => {
  if (!offerDocumentMatchesCasabella(id, record) || !isOfferActive(record, today)) return null;
  const base = {
    badge: text(record?.badge),
    kicker: text(record?.kicker),
    title: text(record?.title),
    message: text(record?.message),
    imageUrl: text(record?.imageUrl),
    ctaLabel: text(record?.ctaLabel),
    ctaPath: text(record?.ctaPath),
  };
  const rawSlides = Array.isArray(record?.slides) ? record.slides : [];
  const slides = rawSlides
    .filter((slide) => slide && typeof slide === 'object' && !Array.isArray(slide))
    .map((slide) => normalizeOfferSlide(slide, base))
    .filter(Boolean);
  const resolvedSlides = slides.length ? slides : (base.title ? [normalizeOfferSlide(base)].filter(Boolean) : []);
  if (!resolvedSlides.length) return null;
  const duration = Number(record?.slideDurationMs);
  const updatedAt = record?.updatedAt?.toDate
    ? record.updatedAt.toDate().toISOString()
    : text(record?.updatedAt);
  return {
    id,
    slideDurationMs: Number.isFinite(duration) && duration >= 1000 && duration <= 60000 ? duration : 6500,
    slides: resolvedSlides,
    updatedAt,
  };
};
