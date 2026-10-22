// Accepts a JS Date, a Firestore Timestamp, or an ISO string and returns a JS Date (or null).
export const toJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateTime = (value) => {
  const date = toJsDate(value);
  if (!date) return '—';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatDateShort = (value) => {
  const date = toJsDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-US');
};

export const formatSpent = (value) => {
  const num = Number(value) || 0;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value) => (Number(value) || 0).toLocaleString('en-US');
