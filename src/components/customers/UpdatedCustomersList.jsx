import { useMemo, useState } from 'react';
import { formatPhone } from '../../utils/phone';
import { formatDateShort, formatSpent } from '../../utils/formatters';

const FIELD_LABELS = { name: 'Name', points: 'Points', visits: 'Visits', spent: 'Spent', lastVisit: 'Last Visit' };

const formatFieldValue = (field, value) => {
  if (field === 'spent') return formatSpent(value);
  if (field === 'lastVisit') return formatDateShort(value);
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

// GitHub-style diff view: one card per updated customer, listing only the fields that changed
// as "old value → new value".
const UpdatedCustomersList = ({ rows }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    const digits = term.replace(/\D/g, '');
    return rows.filter(
      (row) =>
        String(row.name || '').toLowerCase().includes(term) ||
        (digits && String(row.phoneNumber || '').includes(digits))
    );
  }, [rows, search]);

  return (
    <div className="cdb-table-wrap">
      <div className="cdb-table-toolbar">
        <input
          className="field-input cdb-search-input"
          placeholder="Search updated customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="muted">{filtered.length} of {rows.length}</span>
      </div>
      <div className="cdb-diff-scroll">
        {filtered.length === 0 ? (
          <p className="muted" style={{ padding: '1rem' }}>No updated customers.</p>
        ) : (
          filtered.map((row) => (
            <div key={row.phoneNumber} className="cdb-diff-card">
              <div className="cdb-diff-card-header">
                <strong>{row.name}</strong>
                <span className="muted">{formatPhone(row.phoneNumber)}</span>
              </div>
              <div className="cdb-diff-fields">
                {Object.entries(row.changes || {}).map(([field, change]) => (
                  <div key={field} className="cdb-diff-field">
                    <span className="cdb-diff-field-label">{FIELD_LABELS[field] || field}</span>
                    <span className="cdb-diff-old">{formatFieldValue(field, change.old)}</span>
                    <span className="cdb-diff-arrow">→</span>
                    <span className="cdb-diff-new">{formatFieldValue(field, change.new)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UpdatedCustomersList;
