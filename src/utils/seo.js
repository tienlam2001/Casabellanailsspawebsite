const business = {
  name: 'Casabella Nail & Spa',
  alternateName: 'Casabella Nail Spa Oviedo',
  siteUrl: 'https://www.casabellanailspaoviedo.com',
  title: 'Casabella Nail & Spa | Nail Salon in Oviedo, FL Near Orlando',
  description:
    'Casabella Nail & Spa is a nail salon in Oviedo, FL, a short drive from Orlando, offering manicures, pedicures, acrylic nails, dip powder, builder gel, Gel-X, nail art, waxing, and spa treatments.',
  phone: '+1-321-444-6297',
  email: 'oviedonail@gmail.com',
  image: '/casabella.png',
  streetAddress: '2871 Clayton Crossing Way #1033',
  locality: 'Oviedo',
  region: 'FL',
  postalCode: '32765',
  country: 'US',
  latitude: 28.6692,
  longitude: -81.2081,
  instagram: 'https://www.instagram.com/casabellaoviedoo/',
  bookingUrl: 'https://abcapp.us/feedback/appointment?appid=v7sc4jT',
  areaServed: [
    'Oviedo',
    'Orlando',
    'Winter Springs',
    'Chuluota',
    'Geneva',
    'Winter Park',
    'Casselberry',
    'Seminole County',
  ],
};

const baseTitle = business.title;
const siteUrl = business.siteUrl;
const defaultKeywords = [
  'nail salon Oviedo FL',
  'Casabella Nail Spa Oviedo',
  'manicure Oviedo',
  'pedicure Oviedo',
  'acrylic nails Oviedo',
  'dip powder nails Oviedo',
  'Gel-X Oviedo',
  'nail art Oviedo',
  'waxing Oviedo',
  'nail salon near Orlando',
].join(', ');

const absoluteUrl = (path = '/') => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const setDocumentTitle = (title) => {
  if (typeof document === 'undefined') return;
  document.title = title ? `${title} | ${business.name}` : baseTitle;
};

const getOrCreateMeta = (selector, attrs) => {
  const tag =
    document.querySelector(selector) ||
    (() => {
      const meta = document.createElement('meta');
      Object.entries(attrs).forEach(([key, value]) => {
        meta.setAttribute(key, value);
      });
      document.head.appendChild(meta);
      return meta;
    })();
  return tag;
};

const setMetaDescription = (description = business.description) => {
  if (typeof document === 'undefined') return;
  getOrCreateMeta('meta[name="description"]', { name: 'description' }).content = description;
};

const setRobotsMeta = (content = 'index, follow') => {
  if (typeof document === 'undefined') return;
  getOrCreateMeta('meta[name="robots"]', { name: 'robots' }).content = content;
};

const setCanonicalUrl = (path = window.location.pathname) => {
  if (typeof document === 'undefined') return;
  const href = absoluteUrl(path);
  const tag =
    document.querySelector('link[rel="canonical"]') ||
    (() => {
      const link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
      return link;
    })();
  tag.href = href;
};

const setMetaProperty = (property, content) => {
  if (typeof document === 'undefined') return;
  getOrCreateMeta(`meta[property="${property}"]`, { property }).content = content;
};

const setMetaName = (name, content) => {
  if (typeof document === 'undefined') return;
  getOrCreateMeta(`meta[name="${name}"]`, { name }).content = content;
};

const setSocialMeta = ({ title = baseTitle, description = business.description, path = window.location.pathname } = {}) => {
  const url = absoluteUrl(path);
  const image = absoluteUrl(business.image);
  setMetaProperty('og:type', 'website');
  setMetaProperty('og:site_name', business.name);
  setMetaProperty('og:title', title);
  setMetaProperty('og:description', description);
  setMetaProperty('og:url', url);
  setMetaProperty('og:image', image);
  setMetaProperty('og:image:alt', `${business.name} nail salon in Oviedo, Florida`);
  setMetaProperty('og:locale', 'en_US');
  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', title);
  setMetaName('twitter:description', description);
  setMetaName('twitter:image', image);
  setMetaName('twitter:image:alt', `${business.name} nail salon in Oviedo, Florida`);
};

const setJsonLd = (id, data) => {
  if (typeof document === 'undefined') return;
  const selector = `script[data-seo-id="${id}"]`;
  const tag =
    document.querySelector(selector) ||
    (() => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoId = id;
      document.head.appendChild(script);
      return script;
    })();
  tag.textContent = JSON.stringify(data);
};

const clearJsonLd = (id) => {
  if (typeof document === 'undefined') return;
  document.querySelector(`script[data-seo-id="${id}"]`)?.remove();
};

const getBreadcrumbName = (segment) => {
  const names = {
    services: 'Services',
    booking: 'Booking',
    gallery: 'Gallery',
    promotions: 'Promotions',
    'promotion-reminders': 'Promotion Reminders',
    blog: 'Blog',
    contact: 'Contact',
  };
  return names[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const setWebsiteJsonLd = () =>
  setJsonLd('website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    name: business.name,
    alternateName: business.alternateName,
    url: absoluteUrl('/'),
    inLanguage: 'en-US',
    publisher: {
      '@id': `${absoluteUrl('/')}#nailsalon`,
    },
  });

const setWebPageJsonLd = ({ title, description, path }) =>
  setJsonLd('webpage', {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title || baseTitle,
    description,
    inLanguage: 'en-US',
    isPartOf: {
      '@id': `${absoluteUrl('/')}#website`,
    },
    about: {
      '@id': `${absoluteUrl('/')}#nailsalon`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absoluteUrl(business.image),
    },
  });

const setBreadcrumbJsonLd = (path = '/') => {
  const cleanPath = String(path || '/').split('?')[0].replace(/\/+$/, '') || '/';
  const segments = cleanPath === '/' ? [] : cleanPath.split('/').filter(Boolean);
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: absoluteUrl('/'),
    },
    ...segments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: getBreadcrumbName(segment),
      item: absoluteUrl(`/${segments.slice(0, index + 1).join('/')}`),
    })),
  ];

  setJsonLd('breadcrumbs', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  });
};

const setPageSeo = ({ title, description, path, robots = 'index, follow', keywords = defaultKeywords }) => {
  const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const fullTitle = title ? `${title} | ${business.name}` : baseTitle;
  setDocumentTitle(title);
  setMetaDescription(description);
  setRobotsMeta(robots);
  setMetaName('keywords', keywords);
  setCanonicalUrl(pagePath);
  setSocialMeta({ title: fullTitle, description, path: pagePath });
  setWebsiteJsonLd();
  setWebPageJsonLd({ title: fullTitle, description, path: pagePath });
  setBreadcrumbJsonLd(pagePath);
  clearJsonLd('faq');
  clearJsonLd('service-catalog');
  clearJsonLd('article');
};

const localBusinessJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'NailSalon',
  '@id': `${absoluteUrl('/')}#nailsalon`,
  name: business.name,
  alternateName: business.alternateName,
  description: business.description,
  url: absoluteUrl('/'),
  image: absoluteUrl(business.image),
  logo: absoluteUrl(business.image),
  telephone: business.phone,
  email: business.email,
  priceRange: '$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Cash, Credit Card, Debit Card',
  slogan: 'Luxury nail and spa care in Oviedo, Florida',
  sameAs: [business.instagram],
  address: {
    '@type': 'PostalAddress',
    streetAddress: business.streetAddress,
    addressLocality: business.locality,
    addressRegion: business.region,
    postalCode: business.postalCode,
    addressCountry: business.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: business.latitude,
    longitude: business.longitude,
  },
  hasMap:
    'https://www.google.com/maps/search/?api=1&query=2871%20Clayton%20Crossing%20Way%20%231033%2C%20Oviedo%2C%20FL%2032765',
  potentialAction: {
    '@type': 'ReserveAction',
    target: business.bookingUrl,
    result: {
      '@type': 'Reservation',
      name: 'Nail salon appointment',
    },
  },
  areaServed: business.areaServed.map((name) => ({ '@type': 'Place', name })),
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:30',
      closes: '19:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '09:30',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '11:00',
      closes: '17:00',
    },
  ],
  makesOffer: [
    'Manicure',
    'Pedicure',
    'Acrylic nails',
    'Dip powder nails',
    'Builder gel',
    'Gel-X extensions',
    'Nail art',
    'Waxing',
  ].map((name) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name,
      areaServed: ['Oviedo, FL', 'Orlando, FL'],
    },
  })),
});

const setLocalBusinessJsonLd = () => setJsonLd('local-business', localBusinessJsonLd());

const setFaqJsonLd = (faqs) =>
  setJsonLd('faq', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  });

const setServiceCatalogJsonLd = (services) =>
  setJsonLd('service-catalog', {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `${business.name} services`,
    url: absoluteUrl('/services'),
    itemListElement: services.map((service, index) => ({
      '@type': 'Offer',
      position: index + 1,
      url: absoluteUrl('/services'),
      priceCurrency: 'USD',
      price: service.priceFrom,
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'USD',
        price: service.priceFrom,
        minPrice: service.priceFrom,
      },
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.shortDescription,
        serviceType: service.category,
        provider: {
          '@id': `${absoluteUrl('/')}#nailsalon`,
        },
        areaServed: [
          { '@type': 'Place', name: 'Oviedo, FL' },
          { '@type': 'Place', name: 'Orlando, FL' },
        ],
      },
    })),
  });

const setArticleJsonLd = (post) =>
  setJsonLd('article', {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${absoluteUrl(`/blog/${post.slug}`)}#article`,
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@id': `${absoluteUrl(`/blog/${post.slug}`)}#webpage`,
    },
    author: {
      '@type': 'Organization',
      name: business.name,
      url: absoluteUrl('/'),
    },
    publisher: {
      '@id': `${absoluteUrl('/')}#nailsalon`,
    },
    image: absoluteUrl(business.image),
  });

export {
  business,
  setDocumentTitle,
  setMetaDescription,
  setRobotsMeta,
  setPageSeo,
  setLocalBusinessJsonLd,
  setFaqJsonLd,
  setServiceCatalogJsonLd,
  setArticleJsonLd,
};
