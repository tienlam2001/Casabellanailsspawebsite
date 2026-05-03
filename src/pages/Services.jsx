import { useEffect, useMemo, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { setDocumentTitle, setMetaDescription } from '../utils/seo';
import { getFromStorage, saveToStorage } from '../utils/storage';
import staticServices from '../data/services.json';
import {
  getAdminToken,
  setAdminToken,
  getServices,
  updateServicePrices,
  createService,
} from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';

const serviceKey = (service) => `${service.name}::${service.category}`;

const initialNewService = {
  name: '',
  shortDescription: '',
  duration: '',
  category: '',
  priceFrom: '',
};

const Services = () => {
  const [services, setServices] = useState(staticServices);
  const [activeCategory, setActiveCategory] = useState('All');
  const [editingKey, setEditingKey] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState(initialNewService);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const adminSession = getFromStorage(ADMIN_SESSION_KEY, null);
  const isAdmin = Boolean(adminSession?.loggedIn && getAdminToken());

  useEffect(() => {
    setDocumentTitle('Services');
    setMetaDescription('Explore manicure, pedicure, and spa services at Casabella Nail & Spa in Oviedo, Florida, including gel, dip, and relaxing add-ons.');
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const remoteServices = await getServices();
        if (!mounted || !Array.isArray(remoteServices) || remoteServices.length === 0) return;
        setServices(remoteServices);
      } catch {
        // Keep static fallback on failure.
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(services.map((item) => item.category)))],
    [services]
  );

  const groupedServices = useMemo(() => {
    const visible =
      activeCategory === 'All'
        ? services
        : services.filter((item) => item.category === activeCategory);

    const grouped = visible.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => a.priceFrom - b.priceFrom),
    }));
  }, [activeCategory, services]);

  const totalVisible = groupedServices.reduce((sum, group) => sum + group.items.length, 0);
  const allVisibleItems = groupedServices.flatMap((group) => group.items);
  const minPrice = allVisibleItems.length ? Math.min(...allVisibleItems.map((item) => item.priceFrom)) : 0;
  const maxPrice = allVisibleItems.length ? Math.max(...allVisibleItems.map((item) => item.priceFrom)) : 0;

  const clearAdminSession = () => {
    setAdminToken(null);
    saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
  };

  const startEdit = (service) => {
    setEditingKey(serviceKey(service));
    setEditingPrice(String(service.priceFrom));
    setNotice('');
    setError('');
  };

  const cancelEdit = () => {
    setEditingKey('');
    setEditingPrice('');
  };

  const savePrice = async (service) => {
    if (!/^\d+$/.test(editingPrice.trim())) {
      setError('Price must be a whole number.');
      return;
    }

    const nextPrice = Number(editingPrice);
    if (nextPrice < 0 || nextPrice > 10000) {
      setError('Price must be between 0 and 10000.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (!getAdminToken()) {
        clearAdminSession();
        setError('Please log in again to edit prices.');
        return;
      }
      if (nextPrice === service.priceFrom) {
        setNotice('No change to save.');
        cancelEdit();
        return;
      }

      const updated = await updateServicePrices([
        { name: service.name, category: service.category, priceFrom: nextPrice },
      ]);
      setServices(updated);
      setNotice(`Saved new price for ${service.name}.`);
      cancelEdit();
    } catch (err) {
      if (err.status === 401) {
        clearAdminSession();
        setError('Admin session expired. Please log in again.');
        return;
      }
      if (err.status === 404) {
        setError('Price API endpoint was not found. Restart/update your backend server and try again.');
        return;
      }
      setError(err.message || 'Unable to save price.');
    } finally {
      setSaving(false);
    }
  };

  const handleNewServiceChange = (field, value) => {
    setNewService((prev) => ({ ...prev, [field]: value }));
    setError('');
    setNotice('');
  };

  const saveNewService = async () => {
    const payload = {
      ...newService,
      name: newService.name.trim(),
      shortDescription: newService.shortDescription.trim(),
      duration: newService.duration.trim(),
      category: newService.category.trim(),
      priceFrom: Number(newService.priceFrom),
    };

    if (
      !payload.name ||
      !payload.shortDescription ||
      !payload.duration ||
      !payload.category ||
      !Number.isInteger(payload.priceFrom)
    ) {
      setError('Please complete all fields. Price must be a whole number.');
      return;
    }

    if (payload.priceFrom < 0 || payload.priceFrom > 10000) {
      setError('Price must be between 0 and 10000.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (!getAdminToken()) {
        clearAdminSession();
        setError('Please log in again to add services.');
        return;
      }
      const updated = await createService(payload);
      setServices(updated);
      setShowAddForm(false);
      setNewService(initialNewService);
      setNotice(`Added ${payload.name}.`);
    } catch (err) {
      if (err.status === 401) {
        clearAdminSession();
        setError('Admin session expired. Please log in again.');
        return;
      }
      if (err.status === 404) {
        setError('Add-service API endpoint was not found. Restart/update your backend server and try again.');
        return;
      }
      setError(err.message || 'Unable to add service.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Section
        eyebrow="Services Menu"
        title="Meticulous nail care and spa rituals"
        description="Every appointment is customized. Pricing varies by finish and art level; request a consultation for bespoke looks."
      >
        <div className="services-toolbar reveal reveal-delay-1">
          <div className="services-filters">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`services-filter-chip ${activeCategory === category ? 'active' : ''}`}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="services-stats">
            <span className="pill">{totalVisible} services</span>
            <span className="pill">From ${minPrice}</span>
            <span className="pill">Up to ${maxPrice}</span>
            {isAdmin ? <span className="pill">Admin edit mode</span> : null}
          </div>
        </div>

        {isAdmin ? (
          <Card style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="muted" style={{ margin: 0 }}>
                You are logged in as admin. Use the pen icon to edit price.
              </p>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm((v) => !v)}>
                {showAddForm ? 'Cancel Add Service' : 'Add Service'}
              </Button>
            </div>

            {showAddForm ? (
              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <input className="field-input" placeholder="Service name" value={newService.name} onChange={(e) => handleNewServiceChange('name', e.target.value)} />
                  <input className="field-input" placeholder="Category" value={newService.category} onChange={(e) => handleNewServiceChange('category', e.target.value)} />
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <input className="field-input" placeholder="Duration (e.g. 45 min)" value={newService.duration} onChange={(e) => handleNewServiceChange('duration', e.target.value)} />
                  <input className="field-input" inputMode="numeric" placeholder="Price" value={newService.priceFrom} onChange={(e) => handleNewServiceChange('priceFrom', e.target.value)} />
                </div>
                <textarea className="field-textarea" rows={3} placeholder="Short description" value={newService.shortDescription} onChange={(e) => handleNewServiceChange('shortDescription', e.target.value)} />
                <div>
                  <Button type="button" onClick={saveNewService} disabled={saving}>{saving ? 'Saving...' : 'Save New Service'}</Button>
                </div>
              </div>
            ) : null}

            {notice ? <p className="muted" style={{ marginTop: '0.85rem', marginBottom: 0 }}>{notice}</p> : null}
            {error ? <p className="field-error" style={{ marginTop: '0.85rem', marginBottom: 0 }}>{error}</p> : null}
          </Card>
        ) : null}

        <div className="services-group-list">
          {groupedServices.map((group) => (
            <Card key={group.category} className="services-group-card reveal">
              <div className="services-group-header">
                <h3 className="section-title services-group-title">{group.category}</h3>
                <span className="pill">{group.items.length} options</span>
              </div>

              <div className="services-items">
                {group.items.map((service) => {
                  const key = serviceKey(service);
                  const isEditing = editingKey === key;

                  return (
                    <article key={key} className="service-item">
                      <div className="service-main">
                        <h4 className="service-name">{service.name}</h4>
                        <p className="service-description">{service.shortDescription}</p>
                      </div>
                      <div className="service-meta">
                        <p className="service-price-label">From</p>
                        {isEditing ? (
                          <div style={{ display: 'grid', gap: '0.35rem' }}>
                            <input
                              className="field-input"
                              inputMode="numeric"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              style={{ minWidth: '90px', textAlign: 'right', padding: '0.45rem 0.6rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button type="button" className="services-filter-chip" onClick={() => savePrice(service)} disabled={saving}>Save</button>
                              <button type="button" className="services-filter-chip" onClick={cancelEdit} disabled={saving}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className="service-price-value">
                            ${service.priceFrom}+{' '}
                            {isAdmin ? (
                              <button
                                type="button"
                                aria-label={`Edit price for ${service.name}`}
                                onClick={() => startEdit(service)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.95rem' }}
                              >
                                ✎
                              </button>
                            ) : null}
                          </p>
                        )}
                        <p className="service-duration">{service.duration}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <div className="card services-cta">
          <div className="muted">
            <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
              Easy to book
            </p>
            <p>Choose your service list, then add preferences during booking notes.</p>
          </div>
          <Button to={ROUTES.bookingExternal}>Request Booking</Button>
        </div>
      </Section>
    </div>
  );
};

export default Services;
