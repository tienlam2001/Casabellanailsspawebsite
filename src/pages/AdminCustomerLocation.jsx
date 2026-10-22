import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import CustomerTable from '../components/customers/CustomerTable';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import { logoutAdmin } from '../utils/adminApi';
import { formatDateTime, formatNumber } from '../utils/formatters';
import { getLocation, getLocationCustomers, getLocationImports } from '../utils/customerDb';
import ROUTES, { adminCustomerImportPath, adminCustomerImportDetailPath } from '../constants/routes';

const ADMIN_SESSION_KEY = 'adminSession';

const AdminCustomerLocation = () => {
  const navigate = useNavigate();
  const { locationId } = useParams();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);

  const [location, setLocation] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDocumentTitle('Location Customers');
    setMetaDescription('Customer database and import history for a business location.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [loc, customerList, importList] = await Promise.all([
          getLocation(locationId),
          getLocationCustomers(locationId),
          getLocationImports(locationId),
        ]);
        setLocation(loc);
        setCustomers(customerList);
        setImports(importList);
      } catch (err) {
        setError(err.message || 'Unable to load this location.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locationId]);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: `/admin/customers/${locationId}` }} />;
  }

  const onLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
      navigate(ROUTES.adminLogin, { replace: true });
    }
  };

  if (loading) {
    return (
      <Section eyebrow="Admin" title="Loading location..." description="">
        <p className="muted">Loading...</p>
      </Section>
    );
  }

  if (!location) {
    return (
      <Section eyebrow="Admin" title="Location not found" description={error || 'This location does not exist.'}>
        <Button to={ROUTES.adminCustomers}>Back to Dashboard</Button>
      </Section>
    );
  }

  return (
    <Section eyebrow="Admin" title={location.name} description="Location customer database and import history.">
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button to={adminCustomerImportPath(location.id)}>Upload CSV</Button>
          <Button to={ROUTES.adminCustomers} variant="secondary">Back to Dashboard</Button>
        </div>
        <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
      </div>

      {error ? <p className="field-error" style={{ marginTop: '1rem' }}>{error}</p> : null}

      <div className="cdb-stat-grid" style={{ marginTop: '1.5rem' }}>
        <div className="cdb-stat">
          <span className="cdb-stat-value">{formatNumber(location.customerCount)}</span>
          <span className="cdb-stat-label">Total Customers</span>
        </div>
        <div className="cdb-stat">
          <span className="cdb-stat-value" style={{ fontSize: '1.3rem' }}>
            {location.lastImportAt ? formatDateTime(location.lastImportAt) : 'No uploads yet'}
          </span>
          <span className="cdb-stat-label">Most Recent Upload</span>
        </div>
        <div className="cdb-stat cdb-stat-new">
          <span className="cdb-stat-value">{formatNumber(location.lastImportNewCount)}</span>
          <span className="cdb-stat-label">New (Last Upload)</span>
        </div>
        <div className="cdb-stat cdb-stat-updated">
          <span className="cdb-stat-value">{formatNumber(location.lastImportUpdatedCount)}</span>
          <span className="cdb-stat-label">Updated (Last Upload)</span>
        </div>
      </div>

      <Card style={{ marginTop: '1.5rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Customers</p>
        <CustomerTable rows={customers} emptyLabel="No customers yet. Upload a CSV to get started." />
      </Card>

      <Card style={{ marginTop: '1.5rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Import History</p>
        {imports.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No imports yet for this location.</p>
        ) : (
          <div className="cdb-table-scroll">
            <table className="cdb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>File</th>
                  <th>CSV Rows</th>
                  <th>New</th>
                  <th>Updated</th>
                  <th>Unchanged</th>
                  <th>Invalid</th>
                  <th>Total After</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td>{formatDateTime(imp.uploadedAt)}</td>
                    <td>{imp.fileName}</td>
                    <td>{formatNumber(imp.csvRecordCount)}</td>
                    <td>{formatNumber(imp.newCount)}</td>
                    <td>{formatNumber(imp.updatedCount)}</td>
                    <td>{formatNumber(imp.unchangedCount)}</td>
                    <td>{formatNumber(imp.invalidCount)}</td>
                    <td>{formatNumber(imp.totalCustomersAfter)}</td>
                    <td>
                      <Button to={adminCustomerImportDetailPath(location.id, imp.id)} variant="secondary">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Section>
  );
};

export default AdminCustomerLocation;
