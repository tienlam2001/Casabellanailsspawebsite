# Casabella Nail & Spa — Oviedo, Florida

Luxury, mobile-first React + Vite site with React Router and handcrafted CSS (no Tailwind required). Pages: Home, Services, Booking, Gallery, Blog, Contact.

## Run locally
1) Install deps: `npm install`
2) Copy env template: `cp .env.example .env` and set secure admin values
3) Start app + admin API: `npm run dev:full`
4) Production build: `npm run build` then `npm run preview`

## Admin login and advertising
- Admin login route: `/admin/login`
- Admin panel route: `/admin/advertise`
- Admin services pricing route: `/admin/services`
- Admin auth is handled by backend token API (`server/index.js`)
- Configure credentials and secret via `.env`:
`ADMIN_USER`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `ADMIN_ALLOWED_ORIGIN`
- Frontend API base uses:
`VITE_ADMIN_API_BASE` (default `http://localhost:8787`)

## Customize content
- Business info: edit text in `src/components/NavBar.jsx` and `src/components/Footer.jsx`.
- Services: defaults live in `src/data/services.json`; runtime editable prices are persisted by backend API in `server/data/services.json`.
- Testimonials: `src/data/testimonials.json`.
- Blog posts: `src/data/posts.json` (supports `tags` and simple markdown-ish lists with `- `).
- Gallery: tweak image list in `src/pages/Gallery.jsx` (`src`, `alt`, `category`).
- Hero/Home copy: adjust sections in `src/pages/Home.jsx`.
- Forms store submissions to `localStorage` under `bookingRequests` and `contactRequests`.
- Offer popup content is fetched from backend API and cached in `localStorage` as fallback.

## Notes
- Styling lives in `src/index.css` (CSS variables, layout, buttons, cards, forms).
- SEO titles/descriptions are set per route with `src/utils/seo.js`.
- Booking and Contact include validation, success states, and localStorage persistence.
