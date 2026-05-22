import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');
const OFFER_FILE = resolve(DATA_DIR, 'offer.json');
const SERVICES_FILE = resolve(DATA_DIR, 'services.json');
const SOURCE_SERVICES_FILE = resolve(__dirname, '..', 'src', 'data', 'services.json');
const PORT = Number(process.env.ADMIN_API_PORT || 8787);
const ALLOWED_ORIGIN = process.env.ADMIN_ALLOWED_ORIGIN || '*';

const defaultOffer = {
  badge: 'Limited-time perks',
  kicker: 'Welcome to Casabella',
  title: 'New offers every week',
  message: 'Check back often for fresh promotions on your favorite nail and spa treatments.',
  ctaLabel: 'View Offers',
  ctaPath: '/services',
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (ALLOWED_ORIGIN === '*') return true;
  return origin === ALLOWED_ORIGIN;
};

const applyBaseHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );
};

const json = (req, res, status, payload) => {
  applyBaseHeaders(req, res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request body too large');
  }
  return body ? JSON.parse(body) : {};
};

const ensureData = () => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(OFFER_FILE)) writeFileSync(OFFER_FILE, JSON.stringify(defaultOffer, null, 2));
  if (!existsSync(SERVICES_FILE)) {
    const seededServices = JSON.parse(readFileSync(SOURCE_SERVICES_FILE, 'utf-8'));
    writeFileSync(SERVICES_FILE, JSON.stringify(seededServices, null, 2));
  }
};

const loadOffer = () => {
  ensureData();
  try {
    const raw = JSON.parse(readFileSync(OFFER_FILE, 'utf-8'));
    return { ...defaultOffer, ...raw };
  } catch {
    return { ...defaultOffer };
  }
};

const saveOffer = (offer) => {
  ensureData();
  writeFileSync(OFFER_FILE, JSON.stringify(offer, null, 2));
};

const loadServices = () => {
  ensureData();
  try {
    const raw = JSON.parse(readFileSync(SERVICES_FILE, 'utf-8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const saveServices = (services) => {
  ensureData();
  writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
};

const isValidOffer = (candidate) => {
  const keys = ['badge', 'kicker', 'title', 'message', 'ctaLabel', 'ctaPath'];
  return keys.every((key) => typeof candidate?.[key] === 'string' && candidate[key].trim().length > 0);
};

const makeServiceKey = (service) =>
  `${String(service?.name || '').trim()}::${String(service?.category || '').trim()}`;

const isValidPrice = (value) => Number.isInteger(value) && value >= 0 && value <= 10000;
const isNonEmptyText = (value) => typeof value === 'string' && value.trim().length > 0;

const server = createServer(async (req, res) => {
  if (!isOriginAllowed(req.headers.origin)) {
    return json(req, res, 403, { error: 'Origin not allowed' });
  }

  if (req.method === 'OPTIONS') {
    applyBaseHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(req, res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/offers/welcome') {
      return json(req, res, 200, { offer: loadOffer() });
    }

    if (req.method === 'GET' && url.pathname === '/api/services') {
      return json(req, res, 200, { services: loadServices() });
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/offers/welcome') {
      const body = await readBody(req);
      const offer = body?.offer;
      if (!isValidOffer(offer)) return json(req, res, 400, { error: 'Invalid offer payload' });

      const normalized = {
        badge: offer.badge.trim(),
        kicker: offer.kicker.trim(),
        title: offer.title.trim(),
        message: offer.message.trim(),
        ctaLabel: offer.ctaLabel.trim(),
        ctaPath: offer.ctaPath.trim(),
      };
      saveOffer(normalized);
      return json(req, res, 200, { offer: normalized });
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/services/prices') {
      const body = await readBody(req);
      const updates = body?.updates;
      if (!Array.isArray(updates) || updates.length === 0) {
        return json(req, res, 400, { error: 'Invalid updates payload' });
      }

      const currentServices = loadServices();
      const indexByKey = new Map(currentServices.map((service, idx) => [makeServiceKey(service), idx]));
      const nextServices = [...currentServices];

      for (const update of updates) {
        const name = String(update?.name || '').trim();
        const category = String(update?.category || '').trim();
        const price = update?.priceFrom;
        if (!name || !category || !isValidPrice(price)) {
          return json(req, res, 400, { error: 'Invalid service update payload' });
        }

        const key = `${name}::${category}`;
        const index = indexByKey.get(key);
        if (typeof index !== 'number') {
          return json(req, res, 400, { error: `Unknown service: ${name} (${category})` });
        }

        nextServices[index] = {
          ...nextServices[index],
          priceFrom: price,
        };
      }

      saveServices(nextServices);
      return json(req, res, 200, { services: nextServices });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/services') {
      const body = await readBody(req);
      const service = body?.service;
      if (
        !isNonEmptyText(service?.name) ||
        !isNonEmptyText(service?.shortDescription) ||
        !isNonEmptyText(service?.duration) ||
        !isNonEmptyText(service?.category) ||
        !isValidPrice(service?.priceFrom)
      ) {
        return json(req, res, 400, { error: 'Invalid service payload' });
      }

      const currentServices = loadServices();
      const normalized = {
        name: service.name.trim(),
        shortDescription: service.shortDescription.trim(),
        duration: service.duration.trim(),
        category: service.category.trim(),
        priceFrom: service.priceFrom,
      };

      const exists = currentServices.some((item) => makeServiceKey(item) === makeServiceKey(normalized));
      if (exists) {
        return json(req, res, 400, { error: 'Service already exists for that name and category' });
      }

      const nextServices = [...currentServices, normalized];
      saveServices(nextServices);
      return json(req, res, 201, { services: nextServices });
    }

    return json(req, res, 404, { error: 'Not found' });
  } catch (error) {
    return json(req, res, 500, { error: error?.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Admin API running on http://localhost:${PORT}`);
});
