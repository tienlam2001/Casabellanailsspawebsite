const path = require('node:path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.argv[2];
const userIdentifier = process.env.FIREBASE_ADMIN_USER || process.argv[3];

if (!serviceAccountPath || !userIdentifier) {
  console.error('Usage: node scripts/set-admin-claim.cjs /path/to/service-account.json admin@example.com');
  console.error('You can pass either an admin email address or a Firebase Auth UID.');
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

const getUser = async (identifier) => {
  if (identifier.includes('@')) {
    return auth.getUserByEmail(identifier);
  }
  return auth.getUser(identifier);
};

(async () => {
  const user = await getUser(userIdentifier.trim());
  const existingClaims = user.customClaims || {};
  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    admin: true,
  });

  console.log(`Admin claim set for ${user.email || user.uid}.`);
  console.log('Sign out of the website admin panel, then sign back in.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
