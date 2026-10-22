// Seed locations created automatically the first time the customer dashboard loads.
// Owners can add more locations later from the dashboard — this list is only a starting point.
export const DEFAULT_LOCATIONS = [
  { id: 'lovely-nail-spa', name: 'Lovely Nail & Spa' },
  { id: 'ecco-nails-spa', name: 'Ecco Nails & Spa' },
  { id: 'casabella-nails-spa', name: 'Casabella Nails & Spa' },
];

export const slugifyLocationId = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
