const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:8787';
const ADMIN_TOKEN_KEY = 'adminAuthToken';

const getAdminToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
};

const setAdminToken = (token) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.error || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return data;
};

const loginAdmin = ({ username, password }) =>
  request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

const getWelcomeOffer = async () => {
  const data = await request('/api/offers/welcome');
  return data.offer;
};

const updateWelcomeOffer = async (offer) => {
  const token = getAdminToken();
  const data = await request('/api/admin/offers/welcome', {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ offer }),
  });
  return data.offer;
};

const getServices = async () => {
  const data = await request('/api/services');
  return data.services;
};

const updateServicePrices = async (updates) => {
  const token = getAdminToken();
  const data = await request('/api/admin/services/prices', {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ updates }),
  });
  return data.services;
};

const createService = async (service) => {
  const token = getAdminToken();
  const data = await request('/api/admin/services', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ service }),
  });
  return data.services;
};

export {
  API_BASE,
  ADMIN_TOKEN_KEY,
  getAdminToken,
  setAdminToken,
  loginAdmin,
  getWelcomeOffer,
  updateWelcomeOffer,
  getServices,
  updateServicePrices,
  createService,
};
