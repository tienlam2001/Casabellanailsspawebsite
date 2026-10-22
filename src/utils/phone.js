// Normalizes any phone formatting (parentheses, dashes, spaces, +1 country code)
// down to a bare 10-digit string so it can be used as the Firestore customer doc ID.
export const normalizePhone = (raw) => {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return '';
  return digits;
};

export const formatPhone = (normalized) => {
  const digits = String(normalized ?? '').replace(/\D/g, '');
  if (digits.length !== 10) return String(normalized ?? '');
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
