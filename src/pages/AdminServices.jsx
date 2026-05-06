import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import defaultServices from '../data/services.json';
import {
  getAdminToken,
  setAdminToken,
  getServices,
  updateServicePrices,
  seedServicesCollection,
} from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';

const toKey = (service) => `${service.name}::${service.category}`;

const AdminServices = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const [services, setServices] = useState([]);
  const [draftPrices, setDraftPrices] = useState({});
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setDocumentTitle('Admin Services');
    setMetaDescription('Admin panel for updating service prices.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const remote = await getServices();
        const list = Array.isArray(remote) ? remote : [];
        setServices(list);
        const nextDraft = {};
        for (const service of list) nextDraft[toKey(service)] = String(service.priceFrom);
        setDraftPrices(nextDraft);
      } catch (err) {
        setError(err.message || 'Unable to load services.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminServices }} />;
  }

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(services.map((service) => service.category)))],
    [services]
  );

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return services.filter((service) => {
      const categoryMatch = activeCategory === 'All' || service.category === activeCategory;
      const searchMatch =
        !normalizedSearch ||
        service.name.toLowerCase().includes(normalizedSearch) ||
        service.category.toLowerCase().includes(normalizedSearch);
      return categoryMatch && searchMatch;
    });
  }, [services, search, activeCategory]);

  const changedCount = useMemo(() => {
    let count = 0;
    for (const service of services) {
      const key = toKey(service);
      const nextValue = Number(draftPrices[key]);
      if (!Number.isNaN(nextValue) && nextValue !== service.priceFrom) count += 1;
    }
    return count;
  }, [services, draftPrices]);

  const onPriceChange = (service, value) => {
    const key = toKey(service);
    setDraftPrices((prev) => ({ ...prev, [key]: value }));
    setNotice('');
    setError('');
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onDiscard = () => {
    const nextDraft = {};
    for (const service of services) nextDraft[toKey(service)] = String(service.priceFrom);
    setDraftPrices(nextDraft);
    setFieldErrors({});
    setNotice('Unsaved changes discarded.');
  };

  const onLogout = () => {
    setAdminToken(null);
    saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
    navigate(ROUTES.adminLogin, { replace: true });
  };

  const onSave = async () => {
    setSaving(true);
    setNotice('');
    setError('');
    const nextFieldErrors = {};
    const updates = [];

    for (const service of services) {
      const key = toKey(service);
      const raw = String(draftPrices[key] ?? '').trim();
      if (!/^\d+$/.test(raw)) {
        nextFieldErrors[key] = 'Price must be a whole number';
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) {
        nextFieldErrors[key] = 'Price must be between 0 and 10000';
        continue;
      }
      if (parsed !== service.priceFrom) {
        updates.push({ name: service.name, category: service.category, priceFrom: parsed });
      }
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setSaving(false);
      setError('Please fix invalid prices before saving.');
      return;
    }

    if (updates.length === 0) {
      setSaving(false);
      setNotice('No price changes to save.');
      return;
    }

    try {
      const token = getAdminToken();
      if (!token) {
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }

      const updatedServices = await updateServicePrices(updates);
      setServices(updatedServices);
      const nextDraft = {};
      for (const service of updatedServices) nextDraft[toKey(service)] = String(service.priceFrom);
      setDraftPrices(nextDraft);
      setNotice(`Saved ${updates.length} price change${updates.length > 1 ? 's' : ''}.`);
    } catch (err) {
      if (err.status === 401) {
        setAdminToken(null);
        saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      setError(err.message || 'Unable to save prices.');
    } finally {
      setSaving(false);
    }
  };

  const seedFromDefaults = async (overwrite = false) => {
    try {
      setSaving(true);
      setNotice('');
      setError('');
      const token = getAdminToken();
      if (!token) {
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      const next = await seedServicesCollection(defaultServices, { overwrite });
      setServices(next);
      const nextDraft = {};
      for (const service of next) nextDraft[toKey(service)] = String(service.priceFrom);
      setDraftPrices(nextDraft);
      setNotice(overwrite ? 'Services reset from local defaults.' : 'Firebase services initialized from local defaults.');
    } catch (err) {
      setError(err.message || 'Unable to initialize services.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      eyebrow="Admin"
      title="Service Price Editor"
      description="Update service prices and publish globally for all visitors."
    >
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <FormField label="Search services">
                <FormField.Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a service or category"
                />
              </FormField>
              <FormField label="Category filter">
                <FormField.Select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </FormField.Select>
              </FormField>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <span className="pill">{filteredServices.length} visible</span>
              <span className="pill">{changedCount} unsaved changes</span>
            </div>

            {notice ? <p className="muted" style={{ margin: 0 }}>{notice}</p> : null}
            {error ? <p className="field-error" style={{ margin: 0 }}>{error}</p> : null}

            {loading ? (
              <p className="muted" style={{ margin: 0 }}>Loading services...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '65vh', overflow: 'auto', paddingRight: '0.2rem' }}>
                {filteredServices.map((service) => {
                  const key = toKey(service);
                  return (
                    <div key={key} className="card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <div>
                          <p className="eyebrow" style={{ marginBottom: '0.15rem' }}>{service.category}</p>
                          <h4 className="section-title" style={{ fontSize: '1.1rem', margin: 0 }}>{service.name}</h4>
                          <p className="muted" style={{ margin: '0.35rem 0 0' }}>{service.duration}</p>
                        </div>
                        <FormField label="Price" error={fieldErrors[key]}>
                          <FormField.Input
                            inputMode="numeric"
                            value={draftPrices[key] ?? ''}
                            onChange={(e) => onPriceChange(service, e.target.value)}
                            placeholder="0"
                          />
                        </FormField>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="button" onClick={onSave} disabled={saving || loading}>
                  {saving ? 'Saving...' : 'Save Price Changes'}
                </Button>
                <Button type="button" variant="secondary" onClick={onDiscard} disabled={saving || loading}>
                  Discard Changes
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Admin Navigation</p>
          <h3 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Other admin tools</h3>
          <p className="muted" style={{ marginTop: '0.7rem' }}>
            Need to update weekly popup messaging instead of prices?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.adminAdvertise} variant="secondary">Go to Advertise</Button>
            <Button to={ROUTES.adminGallery} variant="secondary">Go to Gallery Manager</Button>
            <Button to={ROUTES.adminBlog} variant="secondary">Go to Blog Manager</Button>
            <Button to={`${ROUTES.home}?previewOffer=1`} variant="ghost">Preview Popup</Button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
            <Button type="button" variant="secondary" onClick={() => seedFromDefaults(false)} disabled={saving}>
              Initialize Firebase Services
            </Button>
            <Button type="button" variant="ghost" onClick={() => seedFromDefaults(true)} disabled={saving}>
              Reset from Local Defaults
            </Button>
          </div>
          <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
            Changes here are global and stored in Firebase Firestore.
          </p>
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            <Link to={ROUTES.services}>Open public services page</Link>
          </p>
        </Card>
      </div>
    </Section>
  );
};

export default AdminServices;
