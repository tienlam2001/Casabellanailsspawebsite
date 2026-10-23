# Casabella Nail & Spa - Oviedo, Florida

Luxury, mobile-first React + Vite site with React Router and handcrafted CSS (no Tailwind required). Pages: Home, Services, Booking, Gallery, Blog, Contact.

## Run locally
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure Firebase.
3. Start the app: `npm run dev`
4. Build for production: `npm run build`

## Shared Operatix data

Operatix (operatixmanagement.com) and this site share Firebase project `casabellanailsspawebsite`, database `(default)`. The Lovely Nail site reads the same project with the same offer, gallery, and service shapes. This site only shows records for Casabella.

Location matching uses Operatix's own rule: lowercase the name, ignore "and", "spa", "nail", and "nails", then keep records whose remaining words are `casabella`. That includes `casabella`, `Casabella Nails And Spa`, and `Casabella Nail & Spa`. Lovely Nail & Spa and Ecco Nails are excluded.

| What guests see | Firestore | How Casabella is chosen |
| --- | --- | --- |
| Welcome popup and current offers | `offers` | `location == "casabella"`. The live Casabella document is `offers/welcome`. Lovely is `offers/lovely`. Hidden when `enabled` or `isActive` is false, or when `startDate` / `endDate` is outside today. Slides use `title`, `message`, `badge`, `kicker`, `imageUrl`, `ctaLabel`, `ctaPath`, and `slideDurationMs`. |
| Dated promotions | `promotions` | `salonname` / `location` / `business` matches Casabella, `isActive` is not false, and the date window is open. |
| Service menu | `services` | `salonname` is Casabella. Lovely's menu stays in `lovelyNailServices`. `active: false` hides a service. |
| Gallery | `galleryImages` | `location` is `casabella` or `all`, and `isPublic` is true, ordered by `sortOrder`. Fields are `imageUrl`, `caption`, `category`, `location`, `isPublic`, and `sortOrder`. Older photos that only have `alt` and `salonname` still display while the rules allow that read. `imageUrl` may be HTTPS (`media.base44.com`, `firebasestorage.googleapis.com`) or a same-site path. If the query is empty or fails, the saved on-site photos stay up. |
| Contact and booking requests | `websiteLeads` | Writes `name`, `phone`, `email`, `message`, `salonname`, `location: casabella`, `source`, and `source_type` (`contact` or `booking`). |
| Text-reminder signups | `promotionReminderSignups` | Same fields as before, plus `name`, `salonname`, `location`, `source`, and `source_type: promotion-signup` after the rules below are deployed. |
| Upcoming events | `marketingEvents` | `location` is `casabella` or `all`, and `isPublic` is true. Ordered by `startDate`. Shown on the home page and promotions page while the last day (`endDate`, or `startDate` when there is no end) is today or later in America/New_York. An `offerId` links to that offer. Internal notes stay off the site. |
| Business hours | `salonHours/casabella` | `weekly` (`mon` through `sun`, each `{open, close, closed}`), `specialHours` (`date`, `open`, `close`, `closed`, `note`), and `timezone`. Times display as `9:30 AM`. Today's matching special hour shows a notice. A missing document keeps Mon–Fri 9:30 AM – 7:00 PM, Sat 9:30 AM – 6:00 PM, Sun 11:00 AM – 5:00 PM. |

Empty offers and empty event lists stay hidden. A failed events query hides the section and leaves the rest of the page up. The site does not invent a discount when Operatix has no active Casabella offer. If the menu or gallery cannot be reached, the saved on-site menu and photos remain, with a short notice. Contact and booking show an error instead of a fake success when the lead cannot be saved.

### What the owner sets in Operatix

- Offers: choose Casabella and save. The public site reads `offers` where `location` is `casabella`. Set `enabled` to false to hide an offer. AI slide images should be HTTPS `imageUrl` values.
- Marketing events: save a public event with `location` `casabella` or `all`, `isPublic: true`, and `startDate`. Set `offerId` to the offer document id (for Casabella, `welcome`) when the event should link to that offer. Leave `isPublic` false to keep an event off the website. The query needs the composite index on `location`, `isPublic`, and `startDate`.
- Hours: keep `salonHours/casabella` updated. `weekly.mon` through `weekly.sun` use `open` and `close` as `HH:mm`, or `closed: true`. Add a `specialHours` entry with `date` for a one-day change, and set `timezone` (the site uses `America/New_York` when it is missing). Publish the `salonHours` block in `firestore.rules` so guests can read that document.
- Services: set `salonname` to `Casabella Nails And Spa`.
- Gallery: publish photos in `galleryImages` with `location` `casabella` or `all`, `isPublic: true`, `sortOrder`, `imageUrl`, `caption`, and `category`. Older photos that only have `alt` and `salonname` remain visible until the public-read rule below is published; after that, set `isPublic`, `location`, and `sortOrder` on each photo that should stay on the site. The composite index is `isPublic`, `location`, and `sortOrder`.
- Firebase Alerts: include `websiteLeads` and `promotionReminderSignups` in `checkFirebaseRecords` if new leads do not appear. The Operatix source repository was not publicly readable, so that scanner list could not be confirmed. Alerts already display `name`, `phone`, `email`, `salonname`, and `source_type`.
- Deploy `firestore.rules` from this repo before relying on new contact, booking, or labeled reminder signups. Compare it with the live rules first and keep any extra collections already in production. This file includes Casabella `websiteLeads`, the existing reminder signup, public read for `gallery`, public read of `galleryImages` and `marketingEvents` only where `isPublic` is true, public read of `salonHours`, validated admin writes for `lovelyNailServices`, and the Lovely `lovelyNailPromotionList` create rule. `firestore.indexes.json` records the `marketingEvents` index on `location`, `isPublic`, and `startDate`, and the `galleryImages` index on `isPublic`, `location`, and `sortOrder`. Cloudflare Pages uses `public/_redirects` (`/* /index.html 200`) and `public/_headers` with the same response headers as `firebase.json`, including image loads from `media.base44.com` and `firebasestorage.googleapis.com`.

Public visitors can read offers, services, gallery images, promotions, and public marketing events. They can create only validated Casabella leads and reminder signups. They cannot read or edit those submissions, and they cannot read marketing events that are not public. Admin edits still require the Firebase Auth custom claim `admin: true`. No service-account key is used by the website.

## Firebase admin setup
- This app now uses Firebase Authentication + Firestore for admin login and content editing.
- Configure Firebase values in `.env` from your Firebase project settings.
- In Firebase Auth, create email/password users for admins.
- Set the Firebase Auth custom claim `admin: true` on each manager account using a trusted Firebase Admin SDK environment. Sign out and back in after changing claims.
- Deploy `firestore.rules` and `storage.rules`; both reject content mutations unless the ID token contains the admin claim.
- In Firestore, create:
  - Collection `offers`, document `welcome` (popup content fields)
  - Collection `services` with fields:
    `name`, `shortDescription`, `duration`, `category`, `priceFrom`, `key`
    where `key` is `name::category`

## Admin pages
- Admin login route: `/admin/login`
- Admin panel route: `/admin/advertise`
- Admin services pricing route: `/admin/services`

## Customize content
- Business info: edit text in `src/components/NavBar.jsx` and `src/components/Footer.jsx`.
- Services: defaults live in `src/data/services.json`; runtime editable prices are persisted by backend API in `server/data/services.json`.
- Testimonials: `src/data/testimonials.json`.
- Blog posts: `src/data/posts.json` (supports `tags` and simple markdown-ish lists with `- `).
- Gallery: tweak image list in `src/pages/Gallery.jsx` (`src`, `alt`, `category`).
- Hero/Home copy: adjust sections in `src/pages/Home.jsx`.
- Offer popup content is fetched from Firestore and cached in `localStorage` as fallback.

## Notes
- Styling lives in `src/index.css` (CSS variables, layout, buttons, cards, forms).
- SEO titles/descriptions are set per route with `src/utils/seo.js`.
- Booking and Contact include client-side validation and success states without retaining customer form data in browser storage.

## Optional local admin API

`server/index.js` binds to `127.0.0.1` by default. Its mutation routes remain disabled until `ADMIN_API_TOKEN` is configured, and callers must send that value as a Bearer token. Do not put this token in any `VITE_*` variable.
