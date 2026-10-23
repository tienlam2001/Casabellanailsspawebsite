import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGalleryImage, sortGalleryImages } from './galleryImages.js';

test('public Casabella and all-location images keep caption, category, and sort order', () => {
  const image = normalizeGalleryImage('holiday', {
    imageUrl: 'https://media.base44.com/images/public/holiday.png',
    caption: 'Holiday set',
    category: 'Nails',
    location: 'all',
    isPublic: true,
    sortOrder: 2,
  });
  assert.equal(image.alt, 'Holiday set');
  assert.equal(image.src, image.imageUrl);
  assert.equal(image.location, 'all');
  assert.equal(image.sortOrder, 2);
  assert.equal(normalizeGalleryImage('private', {
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/a.jpg',
    caption: 'Hidden',
    location: 'casabella',
    isPublic: false,
    sortOrder: 1,
  }), null);
  assert.equal(normalizeGalleryImage('lovely', {
    imageUrl: 'https://media.base44.com/images/public/lovely.png',
    caption: 'Lovely',
    location: 'lovely',
    isPublic: true,
    sortOrder: 1,
  }), null);
});

test('older gallery documents with alt and salonname still display', () => {
  const image = normalizeGalleryImage('seed-nails-0001', {
    imageUrl: '/assets/Nail1-DMfUt6_L.png',
    alt: 'Nail1',
    category: 'Nails',
    salonname: 'Casabella Nails And Spa',
  });
  assert.equal(image.alt, 'Nail1');
  assert.equal(image.location, 'casabella');
  assert.equal(image.sortOrder, null);
  assert.equal(normalizeGalleryImage('bad', {
    imageUrl: 'javascript:alert(1)',
    alt: 'Bad',
    salonname: 'Casabella Nails And Spa',
  }), null);
  assert.deepEqual(
    sortGalleryImages([
      { id: 'b', category: 'Nails', sortOrder: 5 },
      { id: 'legacy', category: 'Interior', sortOrder: null },
      { id: 'a', category: 'Nails', sortOrder: 1 },
    ]).map((item) => item.id),
    ['a', 'b', 'legacy'],
  );
});
