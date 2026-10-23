import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isCasabellaLocation,
  isCurrentPromotion,
  isOfferActive,
  normalizeOfferDocument,
  offerDocumentMatchesCasabella,
  publicImageUrl,
  recordMatchesCasabella,
} from './salonLocation.js';

test('location names used by Operatix resolve to the right salon', () => {
  assert.equal(isCasabellaLocation('casabella'), true);
  assert.equal(isCasabellaLocation('Casabella Nails And Spa'), true);
  assert.equal(isCasabellaLocation('Casabella Nail & Spa'), true);
  assert.equal(isCasabellaLocation('Casabella Nail & Spa - Oviedo'), true);
  assert.equal(isCasabellaLocation('Lovely Nail & Spa'), false);
  assert.equal(isCasabellaLocation('lovely'), false);
  assert.equal(isCasabellaLocation('Ecco Nails'), false);
});

test('shared records stay on the Casabella location', () => {
  assert.equal(recordMatchesCasabella({ salonname: 'Casabella Nails And Spa' }), true);
  assert.equal(recordMatchesCasabella({ salonname: 'Lovely Nail & Spa' }), false);
  assert.equal(recordMatchesCasabella({ location: 'casabella', salonname: 'Lovely Nail & Spa' }), false);
  assert.equal(recordMatchesCasabella({ business: 'Casabella Nail & Spa - Oviedo' }), true);
  assert.equal(recordMatchesCasabella({}, { allowUnlabeled: true }), true);
  assert.equal(recordMatchesCasabella({}), false);
});

test('the legacy welcome offer document belongs to Casabella', () => {
  assert.equal(offerDocumentMatchesCasabella('welcome', { location: 'casabella' }), true);
  assert.equal(offerDocumentMatchesCasabella('lovely', { location: 'lovely' }), false);
  assert.equal(offerDocumentMatchesCasabella('welcome', {}), true);
  assert.equal(offerDocumentMatchesCasabella('other', {}), false);
});

test('inactive or expired offers are hidden and slides keep Operatix fields', () => {
  const today = '2026-10-23';
  assert.equal(isOfferActive({ enabled: false }, today), false);
  assert.equal(isOfferActive({ isActive: false }, today), false);
  assert.equal(isOfferActive({ endDate: '2026-10-01' }, today), false);
  assert.equal(isOfferActive({ startDate: '2026-10-01' }, today), true);

  const hidden = normalizeOfferDocument('lovely', {
    location: 'lovely',
    title: 'Lovely only',
    slides: [{ title: 'Lovely slide', message: 'Not for this site', imageUrl: 'https://cdn.example/lovely.png' }],
  }, today);
  assert.equal(hidden, null);

  const inactive = normalizeOfferDocument('welcome', {
    location: 'casabella',
    enabled: false,
    title: 'Hidden',
  }, today);
  assert.equal(inactive, null);

  const offer = normalizeOfferDocument('welcome', {
    location: 'casabella',
    title: 'Parent title',
    badge: 'Parent badge',
    message: 'Parent message',
    ctaPath: 'https://evil.example',
    slideDurationMs: 6500,
    slides: [{
      title: 'Weekday Wellness',
      message: '10% off over $70',
      badge: '10% OFF',
      imageUrl: 'https://media.base44.com/images/poster.png',
      ctaPath: '/promotions',
    }],
  }, today);

  assert.equal(offer.slides.length, 1);
  assert.equal(offer.slides[0].title, 'Weekday Wellness');
  assert.equal(offer.slides[0].imageUrl, 'https://media.base44.com/images/poster.png');
  assert.equal(offer.slides[0].ctaPath, '/promotions');
  assert.equal(publicImageUrl('http://insecure.example/a.png'), '');
  const relative = normalizeOfferDocument('welcome', {
    location: 'casabella',
    title: 'Poster',
    imageUrl: '/promotions/september-special-mon-tue.svg',
  }, today);
  assert.equal(relative.slides[0].imageUrl, '/promotions/september-special-mon-tue.svg');
});

test('undated Operatix offers count as current and dated promotions respect the window', () => {
  const today = '2026-10-23';
  assert.equal(isCurrentPromotion({ isActive: true, title: 'Offer' }, today), true);
  assert.equal(isCurrentPromotion({
    isActive: true,
    startDate: '2026-10-05',
    endDate: '2026-10-31',
  }, today), true);
  assert.equal(isCurrentPromotion({
    isActive: true,
    startDate: '2026-10-05',
    endDate: '2026-10-22',
  }, today), false);
  assert.equal(isCurrentPromotion({ isActive: false }, today), false);
});
