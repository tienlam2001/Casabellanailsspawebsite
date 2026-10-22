import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import { logoutAdmin } from '../utils/adminApi';
import { formatDateTime, formatNumber } from '../utils/formatters';
import { ensureDefaultLocations, addLocation } from '../utils/customerDb';
import ROUTES, { adminCustomerImportPath, adminCustomerLocationPath } from '../constants/routes';

const ADMIN_SESSION_KEY = 'adminSession';

const AdminCustomers = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);

  useEffect(() => {
    setDocumentTitle('Customer Database');
    setMetaDescription('Owner dashboard for customer database imports by location.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await ensureDefaultLocations();
      setLocations(list);
    } catch (err) {
      setError(err.message || 'Unable to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminCustomers }} />;
  }

  const onLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
      navigate(ROUTES.adminLogin, { replace: true });
    }
  };

  const onAddLocation = async (event) => {
    event.preventDefault();
    if (!newLocationName.trim()) return;
    setAddingLocation(true);
    setError('');
    try {
      await addLocation(newLocationName);
      setNewLocationName('');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to add location.');
    } finally {
      setAddingLocation(false);
    }
  };

  return (
    <Section
      eyebrow="Admin"
      title="Customer Database"
      description="Choose a location, upload the latest POS customer export, and sync it to Firebase."
    >
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button to={adminCustomerImportPath()}>Upload CSV</Button>
        <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
      </div>

      {error ? <p className="field-error" style={{ marginTop: '1rem' }}>{error}</p> : null}

      {loading ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>Loading locations...</p>
      ) : (
        <div className="grid-3" style={{ marginTop: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {locations.map((location) => (
            <Card key={location.id}>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Location</p>
              <h3 className="section-title" style={{ margin: 0, fontSize: '1.3rem' }}>{location.name}</h3>

              <div className="cdb-location-stats">
                <div>
                  <span className="cdb-stat-value" style={{ fontSize: '1.6rem' }}>{formatNumber(location.customerCount)}</span>
                  <span className="cdb-stat-label">Total Customers</span>
                </div>
              </div>

              <p className="muted" style={{ margin: '0.9rem 0 0' }}>
                Most recent upload: {location.lastImportAt ? formatDateTime(location.lastImportAt) : 'No uploads yet'}
              </p>
              {location.lastImportId ? (
                <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                  New: {formatNumber(location.lastImportNewCount)} · Updated: {formatNumber(location.lastImportUpdatedCount)}
                </p>
              ) : null}

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
                <Button to={adminCustomerImportPath(location.id)}>Upload CSV</Button>
                <Button to={adminCustomerLocationPath(location.id)} variant="secondary">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card style={{ marginTop: '1.5rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Add a location</p>
        <p className="muted" style={{ marginTop: 0 }}>Each location keeps a fully separate customer database.</p>
        <form onSubmit={onAddLocation} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 260px' }}>
            <FormField label="Location Name">
              <FormField.Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Example: Sunshine Nails & Spa"
              />
            </FormField>
          </div>
          <Button type="submit" disabled={addingLocation || !newLocationName.trim()}>
            {addingLocation ? 'Adding...' : 'Add Location'}
          </Button>
        </form>
      </Card>

      <Card style={{ marginTop: '1.5rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Admin Navigation</p>
        <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button to={ROUTES.adminAdvertise} variant="secondary">Go to Advertise</Button>
          <Button to={ROUTES.adminServices} variant="secondary">Go to Services Pricing</Button>
          <Button to={ROUTES.adminGallery} variant="secondary">Go to Gallery Manager</Button>
          <Button to={ROUTES.adminBlog} variant="secondary">Go to Blog Manager</Button>
          <Button to={ROUTES.adminPromotionReminders} variant="secondary">Promotion Signups</Button>
        </div>
      </Card>
    </Section>
  );
};

export default AdminCustomers;
