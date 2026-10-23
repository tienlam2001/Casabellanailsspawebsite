import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dateOnly,
  eventTiming,
  isUpcomingOrCurrent,
  normalizeMarketingEvent,
  offerPath,
  salonDate,
  visibleMarketingEvents,
} from './marketingEvents.js';

test('salon dates use America/New_York', () => {
  assert.equal(salonDate(new Date('2026-10-24T03:30:00Z')), '2026-10-23');
  assert.equal(salonDate(new Date('2026-10-24T04:30:00Z')), '2026-10-24');
  assert.equal(dateOnly('2026-11-02T15:00:00.000Z'), '2026-11-02');
});

test('only public Casabella or all-location events with a title and start date are kept', () => {
  const today = '2026-10-23';
  assert.equal(normalizeMarketingEvent('draft', {
    title: 'Private',
    location: 'casabella',
    isPublic: false,
    startDate: '2026-10-25',
  }), null);
  assert.equal(normalizeMarketingEvent('lovely', {
    title: 'Lovely night',
    location: 'lovely',
    isPublic: true,
    startDate: '2026-10-25',
  }), null);
  const event = normalizeMarketingEvent('fall', {
    title: 'Fall open house',
    location: 'all',
    isPublic: true,
    startDate: '2026-10-25',
    endDate: '2026-10-26',
    description: 'Meet the team.',
    offerId: 'welcome',
    type: 'Promotion',
  });
  assert.equal(event.locationLabel, 'All locations');
  assert.equal(event.offerPath, '/promotions?offer=welcome#current-offers');
  assert.equal(event.imageUrl, '');
  assert.equal(offerPath('../welcome'), '');
  const pictured = normalizeMarketingEvent('pictured', {
    title: 'Holiday set',
    location: 'Casabella',
    isPublic: true,
    startDate: '2026-12-01',
    end_date: '2026-12-24',
    imageUrl: 'https://media.base44.com/images/public/event.png',
    notes: 'Do not publish this.',
  });
  assert.equal(pictured.imageUrl, 'https://media.base44.com/images/public/event.png');
  assert.equal(pictured.endDate, '2026-12-24');
  assert.equal(pictured.description, '');
  assert.equal(normalizeMarketingEvent('bad-image', {
    title: 'Poster',
    location: 'casabella',
    isPublic: true,
    startDate: '2026-12-01',
    imageUrl: 'javascript:alert(1)',
  }).imageUrl, '');
  assert.equal(isUpcomingOrCurrent(event, today), true);
  assert.equal(eventTiming(event, today), 'Upcoming');
});

test('past events are hidden and a missing end date lasts one day', () => {
  const today = '2026-10-23';
  const events = [
    { id: 'past', title: 'Past', startDate: '2026-10-01', endDate: '2026-10-22' },
    { id: 'yesterday', title: 'Yesterday', startDate: '2026-10-22', endDate: '' },
    { id: 'today', title: 'Today', startDate: '2026-10-23', endDate: '' },
    { id: 'span', title: 'Span', startDate: '2026-10-20', endDate: '2026-10-23' },
    { id: 'next', title: 'Next', startDate: '2026-11-01', endDate: '' },
  ];
  assert.deepEqual(
    visibleMarketingEvents(events, today).map((event) => event.id),
    ['span', 'today', 'next'],
  );
  assert.equal(eventTiming(events[2], today), 'Current');
});
