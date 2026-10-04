const hiddenServiceNames = new Set(['bikini wax', 'full arms wax', 'brazilian wax']);

const serviceDisplayOverrides = {
  'classic manicure': {
    shortDescription: 'Cuticle care, shaping, and polish.',
  },
  'deluxe manicure': {
    shortDescription: 'Includes exfoliation and massage.',
  },
  'pedicure gel polish': {
    shortDescription: 'Add gel polish to any pedicure.',
    priceFrom: 18,
  },
};

const getVisibleServices = (services) => services
  .filter((service) => !hiddenServiceNames.has(String(service?.name || '').trim().toLowerCase()))
  .map((service) => {
    const override = serviceDisplayOverrides[String(service?.name || '').trim().toLowerCase()];
    return override ? { ...service, ...override } : service;
  });

export { getVisibleServices };
