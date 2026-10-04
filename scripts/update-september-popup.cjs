const path = require('node:path');
const { cert, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.argv[2];

if (!serviceAccountPath) {
  console.error('Usage: node scripts/update-september-popup.cjs /path/to/service-account.json');
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

initializeApp({
  credential: cert(serviceAccount),
});

const popupOffer = {
  badge: 'September special',
  kicker: 'Monday + Tuesday',
  title: '10% Off When You Spend Over $60',
  message:
    'Enjoy 10% off Monday and Tuesday during September when your visit is over $60. Promotion updates will be sent by phone or posted later, so stay tuned.',
  ctaLabel: 'Sign Up for Reminders',
  ctaPath: '/promotion-reminders',
  imageUrl: '/promotions/september-special-mon-tue.svg',
  slideDurationMs: 6500,
  slides: [
    {
      badge: 'September special',
      kicker: 'Monday + Tuesday',
      title: '10% Off When You Spend Over $60',
      message:
        'Enjoy 10% off Monday and Tuesday during September when your visit is over $60. Promotion updates will be sent by phone or posted later, so stay tuned.',
      ctaLabel: 'Sign Up for Reminders',
      ctaPath: '/promotion-reminders',
      imageUrl: '/promotions/september-special-mon-tue.svg',
    },
  ],
  updatedAt: FieldValue.serverTimestamp(),
};

(async () => {
  await getFirestore().doc('offers/welcome').set(popupOffer, { merge: false });
  console.log('Popup offer replaced with the September Monday-Tuesday special.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
