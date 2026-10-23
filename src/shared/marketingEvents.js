import { safeAssetUrl } from './salonLocation.js';

// Public Operatix marketingEvents documents.
// Query contract: location in ["casabella", "all"], isPublic == true,
// ordered by startDate. Dates are salon calendar days in America/New_York.
// Internal notes are never shown.

export const MARKETING_EVENT_LOCATIONS = ['casabella', 'all'];

const OFFER_ID = /^[A-Za-z0-9_-]{1,128}$/;
const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})/;

export const salonDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

export const dateOnly = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.trim().match(DATE_ONLY);
    return match ? match[1] : '';
  }
  if (typeof value?.toDate === 'function') return salonDate(value.toDate());
  if (value instanceof Date && !Number.isNaN(value.getTime())) return salonDate(value);
  return '';
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export const isUpcomingOrCurrent = (event, today) => {
  const start = dateOnly(event?.startDate);
  if (!start) return false;
  const end = dateOnly(event?.endDate) || start;
  return end >= today;
};

export const eventTiming = (event, today) => (
  dateOnly(event?.startDate) > today ? 'Upcoming' : 'Current'
);

export const offerPath = (offerId) => {
  const id = text(offerId);
  if (!OFFER_ID.test(id)) return '';
  return `/promotions?offer=${encodeURIComponent(id)}#current-offers`;
};

export const formatSalonDate = (value) => {
  const day = dateOnly(value);
  if (!day) return '';
  const [year, month, date] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, date, 16)));
};

export const normalizeMarketingEvent = (id, record) => {
  if (record?.isPublic !== true) return null;
  const location = text(record?.location).toLowerCase();
  if (!MARKETING_EVENT_LOCATIONS.includes(location)) return null;
  const title = text(record?.title) || text(record?.name);
  const startDate = dateOnly(record?.startDate);
  if (!title || !startDate) return null;
  const description = text(record?.description)
    || text(record?.summary)
    || text(record?.details)
    || text(record?.offerDetail)
    || text(record?.offer_detail);
  return {
    id,
    title,
    description,
    type: text(record?.type),
    location,
    locationLabel: location === 'all' ? 'All locations' : 'Casabella Nail & Spa',
    startDate,
    endDate: dateOnly(record?.endDate) || dateOnly(record?.end_date),
    imageUrl: safeAssetUrl(record?.imageUrl) || safeAssetUrl(record?.image),
    offerId: text(record?.offerId),
    offerPath: offerPath(record?.offerId),
  };
};

export const visibleMarketingEvents = (events, today) => events
  .filter((event) => isUpcomingOrCurrent(event, today))
  .sort((first, second) => first.startDate.localeCompare(second.startDate) || first.title.localeCompare(second.title));
