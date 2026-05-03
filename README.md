# Casabella Nail & Spa — Oviedo, Florida

Luxury, mobile-first React + Vite site with React Router and handcrafted CSS (no Tailwind required). Pages: Home, Services, Booking, Gallery, Blog, Contact.

## Run locally
1) Install deps: `npm install`
2) Copy env template: `cp .env.example .env` and set secure admin values
3) Start app: `npm run dev`
4) Production build: `npm run build` then `npm run preview`

## Firebase admin setup
- This app now uses Firebase Authentication + Firestore for admin login and content editing.
- Configure Firebase values in `.env` from your Firebase project settings.
- Set `VITE_ADMIN_EMAILS` to allowed admin account emails.
- In Firebase Auth, create email/password users for admins.
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
- Forms store submissions to `localStorage` under `bookingRequests` and `contactRequests`.
- Offer popup content is fetched from Firestore and cached in `localStorage` as fallback.

## Notes
- Styling lives in `src/index.css` (CSS variables, layout, buttons, cards, forms).
- SEO titles/descriptions are set per route with `src/utils/seo.js`.
- Booking and Contact include validation, success states, and localStorage persistence.
