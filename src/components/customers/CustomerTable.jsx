import { useMemo, useState } from 'react';
import { formatPhone } from '../../utils/phone';
import { formatDateShort, formatSpent } from '../../utils/formatters';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'points', label: 'Points', numeric: true },
  { key: 'visits', label: 'Visits', numeric: true },
  { key: 'lastVisit', label: 'Last Visit' },
  { key: 'spent', label: 'Spent', numeric: true },
];

// Searchable, sortable, scrollable customer table. Used for the "New Customers Added"
// section after an import and for the full customer list on a location's detail page.
const CustomerTable = ({ rows, emptyLabel = 'No customers to show.', rowClassName }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    let list = rows;
    if (term) {
      list = rows.filter((row) => {
        const nameMatch = String(row.name || '').toLowerCase().includes(term);
        const phoneMatch = digits && String(row.phoneNumber || '').includes(digits);
        return nameMatch || phoneMatch;
      });
    }
    const column = COLUMNS.find((c) => c.key === sortKey);
    const sorted = [...list].sort((a, b) => {
      if (column?.numeric) return (Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0);
      return String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
    });
    if (sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [rows, search, sortKey, sortDir]);

  const onSort = (key) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="cdb-table-wrap">
      <div className="cdb-table-toolbar">
        <input
          className="field-input cdb-search-input"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="muted">{filtered.length} of {rows.length}</span>
      </div>
      <div className="cdb-table-scroll">
        <table className="cdb-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} className="cdb-th-sortable" onClick={() => onSort(col.key)}>
                  {col.label}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="muted" style={{ padding: '1rem' }}>{emptyLabel}</td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.phoneNumber} className={rowClassName ? rowClassName(row) : undefined}>
                  <td>{row.name}</td>
                  <td>{formatPhone(row.phoneNumber)}</td>
                  <td>{row.points ?? 0}</td>
                  <td>{row.visits ?? 0}</td>
                  <td>{formatDateShort(row.lastVisit)}</td>
                  <td>{formatSpent(row.spent)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;
