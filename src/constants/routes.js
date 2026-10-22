const ROUTES = {
  home: '/',
  services: '/services',
  booking: '/booking',
  bookingExternal: 'https://abcapp.us/feedback/appointment?appid=v7sc4jT',
  rewardsExternal: 'https://luxloyaltyapp.com/',
  contactExternal: 'https://www.salonschedules.com/register/tHZA2wJGqJchzHYa1nS3JByAsIh1',
  gallery: '/gallery',
  promotions: '/promotions',
  promotionReminders: '/promotion-reminders',
  terms: '/terms',
  privacy: '/privacy',
  blog: '/blog',
  contact: '/contact',
  adminLogin: '/admin/login',
  adminAdvertise: '/admin/advertise',
  adminServices: '/admin/services',
  adminGallery: '/admin/gallery',
  adminBlog: '/admin/blog',
  adminPromotionReminders: '/admin/promotion-reminders',
  adminCustomers: '/admin/customers',
  adminCustomerImport: '/admin/customers/import',
  adminCustomerLocation: '/admin/customers/:locationId',
  adminCustomerImportDetail: '/admin/customers/:locationId/imports/:importId',
};

export const adminCustomerLocationPath = (locationId) => `/admin/customers/${locationId}`;
export const adminCustomerImportPath = (locationId) =>
  locationId ? `/admin/customers/import?location=${encodeURIComponent(locationId)}` : '/admin/customers/import';
export const adminCustomerImportDetailPath = (locationId, importId) =>
  `/admin/customers/${locationId}/imports/${importId}`;

export default ROUTES;
