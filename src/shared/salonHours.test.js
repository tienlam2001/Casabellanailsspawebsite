import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FALLBACK_WEEKLY,
  formatSalonTime,
  normalizeTimeZone,
  resolveSalonHours,
  salonDateInZone,
} from './salonHours.js';

test('salon times use 9:30 AM formatting', () => {
  assert.equal(formatSalonTime('09:30'), '9:30 AM');
  assert.equal(formatSalonTime('19:00'), '7:00 PM');
  assert.equal(formatSalonTime('00:00'), '12:00 AM');
  assert.equal(formatSalonTime('12:00'), '12:00 PM');
  assert.equal(formatSalonTime('12:05'), '12:05 PM');
  assert.equal(formatSalonTime('9:30'), '');
});

test('missing hours fall back to the published Casabella schedule', () => {
  const hours = resolveSalonHours(null, '2026-10-23');
  assert.equal(hours.source, 'fallback');
  assert.deepEqual(hours.groups.map((group) => `${group.label}: ${group.hours}`), [
    'Mon–Fri: 9:30 AM – 7:00 PM',
    'Sat: 9:30 AM – 6:00 PM',
    'Sun: 11:00 AM – 5:00 PM',
  ]);
  assert.deepEqual(hours.weekdayLines, ['9:30 AM – 7:00 PM']);
  assert.deepEqual(hours.weekendLines, [
    'Sat: 9:30 AM – 6:00 PM',
    'Sun: 11:00 AM – 5:00 PM',
  ]);
  assert.equal(hours.todayNotice, '');
  assert.equal(FALLBACK_WEEKLY.mon.open, '09:30');
});

test('a partial week keeps valid days and fills the rest from the fallback', () => {
  const hours = resolveSalonHours({
    timezone: 'Not/AZone',
    weekly: {
      fri: { open: '10:00', close: '16:00', closed: false },
      sun: { closed: true },
    },
  }, '2026-10-23');
  assert.equal(hours.timezone, 'America/New_York');
  assert.deepEqual(hours.groups.map((group) => `${group.label}: ${group.hours}`), [
    'Mon–Thu: 9:30 AM – 7:00 PM',
    'Fri: 10:00 AM – 4:00 PM',
    'Sat: 9:30 AM – 6:00 PM',
    'Sun: Closed',
  ]);
  assert.equal(normalizeTimeZone('America/Chicago'), 'America/Chicago');
});

test('today uses the salon timezone and shows that special-hours notice', () => {
  assert.equal(salonDateInZone(new Date('2026-10-24T03:30:00Z'), 'America/New_York'), '2026-10-23');
  const record = {
    timezone: 'America/New_York',
    weekly: FALLBACK_WEEKLY,
    specialHours: [
      { date: '2026-10-22', open: '10:00', close: '14:00', closed: false, note: 'Yesterday' },
      { date: '2026-10-23', open: '12:00', close: '16:00', closed: false, note: 'Holiday hours' },
      { date: '2026-10-24', closed: true, note: 'Tomorrow' },
    ],
  };
  const today = salonDateInZone(new Date('2026-10-24T03:30:00Z'), 'America/New_York');
  const hours = resolveSalonHours(record, today);
  assert.equal(hours.todayNotice, 'Today 12:00 PM – 4:00 PM. Holiday hours');
  const closed = resolveSalonHours({
    specialHours: [{ date: '2026-11-26', closed: true, note: 'Thanksgiving' }],
  }, '2026-11-26');
  assert.equal(closed.todayNotice, 'Closed today. Thanksgiving');
  const dated = hours.openingHoursSpecification.find((item) => item.validFrom === '2026-10-23');
  assert.equal(dated.opens, '12:00');
  assert.equal(dated.closes, '16:00');
  assert.equal(dated.dayOfWeek, 'Friday');
});
