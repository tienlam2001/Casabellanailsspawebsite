// Casabella hours from Firestore salonHours/casabella.
// weekly: { mon..sun: { open: 'HH:mm', close: 'HH:mm', closed: bool } }
// specialHours: [{ date: 'YYYY-MM-DD', open, close, closed, note }]
// timezone: IANA zone. Missing or invalid data uses the published site hours.

export const SALON_TIMEZONE = 'America/New_York';

const DAY_ORDER = [
  ['mon', 'Mon', 'Monday'],
  ['tue', 'Tue', 'Tuesday'],
  ['wed', 'Wed', 'Wednesday'],
  ['thu', 'Thu', 'Thursday'],
  ['fri', 'Fri', 'Friday'],
  ['sat', 'Sat', 'Saturday'],
  ['sun', 'Sun', 'Sunday'],
];

const WEEKDAY_KEYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri']);
const WEEKEND_KEYS = new Set(['sat', 'sun']);
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const weekdayHours = { open: '09:30', close: '19:00', closed: false };

export const FALLBACK_WEEKLY = {
  mon: { ...weekdayHours },
  tue: { ...weekdayHours },
  wed: { ...weekdayHours },
  thu: { ...weekdayHours },
  fri: { ...weekdayHours },
  sat: { open: '09:30', close: '18:00', closed: false },
  sun: { open: '11:00', close: '17:00', closed: false },
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeTimeZone = (value) => {
  const zone = text(value);
  if (!zone) return SALON_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format();
    return zone;
  } catch {
    return SALON_TIMEZONE;
  }
};

export const salonDateInZone = (date = new Date(), timeZone = SALON_TIMEZONE) => {
  const zone = normalizeTimeZone(timeZone);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const formatSalonTime = (value) => {
  const match = text(value).match(TIME);
  if (!match) return '';
  let hour = Number(match[1]);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${match[2]} ${suffix}`;
};

const formatRange = (day) => {
  if (day?.closed === true) return 'Closed';
  const open = formatSalonTime(day?.open);
  const close = formatSalonTime(day?.close);
  if (!open || !close) return '';
  return `${open} – ${close}`;
};

const normalizeDay = (value, fallback) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback };
  }
  if (value.closed === true) return { open: '', close: '', closed: true };
  const open = text(value.open);
  const close = text(value.close);
  if (!formatSalonTime(open) || !formatSalonTime(close)) return { ...fallback };
  return { open, close, closed: false };
};

const normalizeSpecial = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const date = text(value.date);
  if (!DATE_ONLY.test(date)) return null;
  const closed = value.closed === true;
  const open = text(value.open);
  const close = text(value.close);
  if (!closed && (!formatSalonTime(open) || !formatSalonTime(close))) return null;
  return {
    date,
    open: closed ? '' : open,
    close: closed ? '' : close,
    closed,
    note: text(value.note).slice(0, 180),
  };
};

const groupWeekly = (weekly) => {
  const groups = [];
  DAY_ORDER.forEach(([key, label], index) => {
    const hours = formatRange(weekly[key]);
    const previous = groups[groups.length - 1];
    if (previous && previous.hours === hours && previous.endIndex === index - 1) {
      previous.endLabel = label;
      previous.endIndex = index;
      previous.days.push(key);
      return;
    }
    groups.push({
      startLabel: label,
      endLabel: label,
      endIndex: index,
      days: [key],
      hours,
    });
  });
  return groups.map((group) => ({
    label: group.startLabel === group.endLabel ? group.startLabel : `${group.startLabel}–${group.endLabel}`,
    hours: group.hours,
    days: group.days,
  }));
};

const linesFor = (groups, keys, { bareWhenComplete = false } = {}) => {
  const selected = groups.filter((group) => group.days.every((day) => keys.has(day)));
  const bare = bareWhenComplete && selected.length === 1 && selected[0].days.length === keys.size;
  return selected.map((group) => (bare ? group.hours : `${group.label}: ${group.hours}`));
};

const weekdayName = (isoDate, timeZone) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  for (let hour = 0; hour < 24; hour += 1) {
    const instant = new Date(Date.UTC(year, month - 1, day, hour));
    const zoned = salonDateInZone(instant, timeZone);
    if (zoned !== isoDate) continue;
    return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(instant);
  }
  return '';
};

const openingHoursSpecification = (weekly, specialHours, today, timeZone) => {
  const byRange = new Map();
  DAY_ORDER.forEach(([key, , schemaName]) => {
    const day = weekly[key];
    if (day.closed) return;
    const id = `${day.open}|${day.close}`;
    const names = byRange.get(id) || [];
    names.push(schemaName);
    byRange.set(id, names);
  });
  const specs = [...byRange.entries()].map(([id, dayOfWeek]) => {
    const [opens, closes] = id.split('|');
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek,
      opens,
      closes,
    };
  });
  specialHours.forEach((special) => {
    if (special.closed || special.date < today) return;
    const dayOfWeek = weekdayName(special.date, timeZone);
    if (!dayOfWeek) return;
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek,
      opens: special.open,
      closes: special.close,
      validFrom: special.date,
      validThrough: special.date,
    });
  });
  return specs;
};

const todayNotice = (special) => {
  if (!special) return '';
  const note = special.note;
  if (special.closed) return note ? `Closed today. ${note}` : 'Closed today.';
  const range = formatRange(special);
  if (!range) return '';
  return note ? `Today ${range}. ${note}` : `Today ${range}.`;
};

export const resolveSalonHours = (record, today) => {
  const timezone = normalizeTimeZone(record?.timezone);
  const weekly = Object.fromEntries(
    DAY_ORDER.map(([key]) => [key, normalizeDay(record?.weekly?.[key], FALLBACK_WEEKLY[key])]),
  );
  const specialHours = Array.isArray(record?.specialHours)
    ? record.specialHours.map(normalizeSpecial).filter(Boolean)
    : [];
  const todaySpecial = [...specialHours].reverse().find((item) => item.date === today) || null;
  const groups = groupWeekly(weekly);
  return {
    timezone,
    source: record ? 'live' : 'fallback',
    groups,
    weekdayLines: linesFor(groups, WEEKDAY_KEYS, { bareWhenComplete: true }),
    weekendLines: linesFor(groups, WEEKEND_KEYS),
    todayNotice: todayNotice(todaySpecial),
    openingHoursSpecification: openingHoursSpecification(weekly, specialHours, today, timezone),
  };
};

export const fallbackOpeningHours = () => resolveSalonHours(null, '1970-01-01').openingHoursSpecification;
