const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const FIELD_COMPARATORS = {
  name: (a, b) => String(a ?? '').trim() === String(b ?? '').trim(),
  points: (a, b) => (Number(a) || 0) === (Number(b) || 0),
  visits: (a, b) => (Number(a) || 0) === (Number(b) || 0),
  spent: (a, b) => round2(a) === round2(b),
  lastVisit: (a, b) => (a || null) === (b || null),
};

// Compares an existing Firestore customer doc against the newest CSV row.
// Returns only the fields that actually changed, each as { old, new }.
export const diffCustomer = (existing, incoming) => {
  const changes = {};
  for (const field of Object.keys(FIELD_COMPARATORS)) {
    const isEqual = FIELD_COMPARATORS[field];
    if (!isEqual(existing?.[field], incoming?.[field])) {
      changes[field] = { old: existing?.[field] ?? null, new: incoming?.[field] ?? null };
    }
  }
  return changes;
};

export const hasChanges = (changes) => Object.keys(changes).length > 0;
