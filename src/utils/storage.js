const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getFromStorage = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const appendToStorage = (key, entry) => {
  const existing = getFromStorage(key, []);
  const next = Array.isArray(existing) ? [...existing, entry] : [entry];
  saveToStorage(key, next);
  return next;
};

export { saveToStorage, getFromStorage, appendToStorage };
