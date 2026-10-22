import { formatDateTime, formatNumber } from '../../utils/formatters';

const Stat = ({ label, value, tone }) => (
  <div className={`cdb-stat ${tone ? `cdb-stat-${tone}` : ''}`}>
    <span className="cdb-stat-value">{formatNumber(value)}</span>
    <span className="cdb-stat-label">{label}</span>
  </div>
);

const ImportSummaryCard = ({ result }) => (
  <div className="cdb-summary-card">
    <div className="cdb-summary-header">
      <span className="cdb-badge cdb-badge-success">Import Successful</span>
      <span className="muted">{formatDateTime(result.uploadedAt)}</span>
    </div>
    <h3 className="section-title" style={{ fontSize: '1.5rem', margin: '0.5rem 0 1.1rem' }}>
      {result.locationName}
    </h3>
    <div className="cdb-stat-grid">
      <Stat label="CSV Records" value={result.csvRecordCount} />
      <Stat label="New Customers" value={result.newCount ?? result.newCustomers?.length ?? 0} tone="new" />
      <Stat label="Updated Customers" value={result.updatedCount ?? result.updatedCustomers?.length ?? 0} tone="updated" />
      <Stat label="Unchanged Customers" value={result.unchangedCount} />
      <Stat label="Invalid / Skipped" value={result.invalidCount ?? result.invalidRows?.length ?? 0} tone="invalid" />
      <Stat label="Database Total" value={result.totalCustomersAfter} tone="total" />
    </div>
    {result.fileName ? <p className="muted" style={{ marginTop: '0.9rem', marginBottom: 0 }}>File: {result.fileName}</p> : null}
  </div>
);

export default ImportSummaryCard;
