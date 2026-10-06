const normalize = (value) => String(value || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const aliases = { mani: 'manicure', pedi: 'pedicure', dip: 'dipping', sns: 'dipping', refill: 'fill', brows: 'eyebrows', kids: 'kid', children: 'kid' };

export const searchServices = (services, query) => {
  const tokens = normalize(query).split(/\s+/).filter(Boolean).map((token) => aliases[token] || token);
  if (!tokens.length) return [];
  return services.map((service) => {
    const name = normalize(service.name);
    const category = normalize(service.category);
    const text = `${name} ${category} ${normalize(service.shortDescription)}`;
    const score = tokens.every((token) => text.includes(token))
      ? tokens.reduce((sum, token) => sum + (name.includes(token) ? 3 : category.includes(token) ? 2 : 1), 0)
      : 0;
    return { service, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.service.priceFrom - b.service.priceFrom)
    .map(({ service }) => service);
};
