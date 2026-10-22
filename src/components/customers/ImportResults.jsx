import Card from '../Card';
import ImportSummaryCard from './ImportSummaryCard';
import CustomerTable from './CustomerTable';
import UpdatedCustomersList from './UpdatedCustomersList';
import InvalidRowsList from './InvalidRowsList';

// Renders a completed import's summary + New Customers Added + Customers Updated + Invalid Rows.
// Used both right after a live sync and when reopening a past import from history.
const ImportResults = ({ result }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <ImportSummaryCard result={result} />

    <Card>
      <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>New Customers Added</p>
      <p className="muted" style={{ marginTop: 0 }}>
        Customers found in this CSV that did not previously exist in the database.
      </p>
      <CustomerTable
        rows={result.newCustomers || []}
        emptyLabel="No new customers in this import."
        rowClassName={() => 'cdb-row-new'}
      />
    </Card>

    <Card>
      <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Customers Updated</p>
      <p className="muted" style={{ marginTop: 0 }}>
        Existing customers whose information changed. Only changed fields are shown.
      </p>
      <UpdatedCustomersList rows={result.updatedCustomers || []} />
    </Card>

    {(result.invalidRows?.length || 0) > 0 && (
      <Card>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Invalid / Skipped Rows</p>
        <p className="muted" style={{ marginTop: 0 }}>
          Rows that could not be imported because required information was missing or invalid.
        </p>
        <InvalidRowsList rows={result.invalidRows} />
      </Card>
    )}
  </div>
);

export default ImportResults;
