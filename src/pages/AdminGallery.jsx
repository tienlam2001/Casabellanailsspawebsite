import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import {
  setAdminToken,
  createGalleryImage,
  deleteGalleryImage,
  getAdminToken,
  getGalleryImages,
  updateGalleryImage,
} from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';
const DEFAULT_FORM = { imageUrl: '', alt: '', category: 'Nails' };

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const AdminGallery = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDocumentTitle('Admin Gallery');
    setMetaDescription('Admin panel for managing gallery images.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const remote = await getGalleryImages();
        setItems(Array.isArray(remote) ? remote : []);
      } catch (err) {
        setError(err.message || 'Unable to load gallery images.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminGallery }} />;
  }

  const categories = useMemo(() => {
    const set = new Set(['Nails', 'Interior']);
    for (const item of items) set.add(item.category);
    return Array.from(set);
  }, [items]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const onLogout = () => {
    setAdminToken(null);
    saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
    navigate(ROUTES.adminLogin, { replace: true });
  };

  const withAuthHandling = async (action) => {
    const token = getAdminToken();
    if (!token) {
      navigate(ROUTES.adminLogin, { replace: true });
      return null;
    }

    try {
      return await action();
    } catch (err) {
      if (err.status === 401) {
        setAdminToken(null);
        saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
        navigate(ROUTES.adminLogin, { replace: true });
        return null;
      }
      throw err;
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');

    const imageUrl = String(form.imageUrl || '').trim();
    const alt = String(form.alt || '').trim();
    const category = String(form.category || '').trim();

    if (!isValidUrl(imageUrl)) {
      setError('Image URL must be a valid http or https URL.');
      return;
    }

    if (!alt) {
      setError('Alt text is required.');
      return;
    }

    if (!category) {
      setError('Category is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = { imageUrl, alt, category };
      const nextItems = await withAuthHandling(async () => {
        if (editingId) return updateGalleryImage(editingId, payload);
        return createGalleryImage(payload);
      });
      if (!nextItems) return;
      setItems(nextItems);
      setNotice(editingId ? 'Image updated.' : 'Image added.');
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save image.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({ imageUrl: item.imageUrl, alt: item.alt, category: item.category });
    setNotice('');
    setError('');
  };

  const onDelete = async (id) => {
    setNotice('');
    setError('');
    setSaving(true);
    try {
      const nextItems = await withAuthHandling(() => deleteGalleryImage(id));
      if (!nextItems) return;
      setItems(nextItems);
      if (editingId === id) resetForm();
      setNotice('Image removed.');
    } catch (err) {
      setError(err.message || 'Unable to remove image.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      eyebrow="Admin"
      title="Gallery Manager"
      description="Add, edit, and remove gallery images shown on the public Gallery page."
    >
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={onSubmit} noValidate>
            <FormField label="Image URL" required>
              <FormField.Input
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Alt text" required>
              <FormField.Input
                value={form.alt}
                onChange={(e) => setForm((prev) => ({ ...prev, alt: e.target.value }))}
                placeholder="Example: Ombre nails with gold accents"
              />
            </FormField>
            <FormField label="Category" required>
              <FormField.Select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </FormField.Select>
            </FormField>

            {notice ? <p className="muted" style={{ margin: 0 }}>{notice}</p> : null}
            {error ? <p className="field-error" style={{ margin: 0 }}>{error}</p> : null}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Image' : 'Add Image'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Clear Form
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Admin Navigation</p>
          <h3 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Other admin tools</h3>
          <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.adminAdvertise} variant="secondary">Go to Advertise</Button>
            <Button to={ROUTES.adminServices} variant="secondary">Go to Services Pricing</Button>
            <Button to={ROUTES.gallery} variant="ghost">Open Public Gallery</Button>
          </div>
          <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
            Images are stored in Firestore collection <code>galleryImages</code>.
          </p>
        </Card>
      </div>

      <Card style={{ marginTop: '1.25rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Current images</p>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>Loading images...</p>
        ) : items.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No gallery images yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {items.map((item) => (
              <div key={item.id} className="card" style={{ padding: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr auto', gap: '0.9rem', alignItems: 'center' }}>
                  <img
                    src={item.imageUrl}
                    alt={item.alt}
                    style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: '12px', background: '#f4f6f7' }}
                  />
                  <div>
                    <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>{item.category}</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{item.alt}</p>
                    <p className="muted" style={{ margin: '0.35rem 0 0', wordBreak: 'break-all' }}>{item.imageUrl}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Button type="button" variant="secondary" onClick={() => onEdit(item)} disabled={saving}>Edit</Button>
                    <Button type="button" variant="ghost" onClick={() => onDelete(item.id)} disabled={saving}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="muted" style={{ marginTop: '0.9rem' }}>
        <Link to={ROUTES.gallery}>View how this appears on the public Gallery page.</Link>
      </p>
    </Section>
  );
};

export default AdminGallery;
