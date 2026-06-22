import { useEffect, useMemo, useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import FormField from '../components/FormField';
import ROUTES from '../constants/routes';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setPageSeo } from '../utils/seo';
import {
  createPromotion,
  deletePromotion,
  getAdminToken,
  getPromotions,
  logoutAdmin,
  setAdminToken,
  updatePromotion,
  uploadPromotionImageFile,
} from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';
const DEFAULT_BUSINESS = 'Casabella Nail & Spa - Oviedo';

const toLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const newPromotionForm = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    title: '',
    description: '',
    offer: '',
    startDate: toLocalDateValue(start),
    endDate: toLocalDateValue(end),
    business: DEFAULT_BUSINESS,
    imageUrl: '',
    isActive: true,
  };
};

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
};

const promotionState = (promotion, today) => {
  if (promotion.endDate < today) return 'Expired';
  if (!promotion.isActive) return 'Inactive';
  if (promotion.startDate > today) return 'Upcoming';
  return 'Active';
};

const PromotionCard = ({ promotion, today, isAdmin, onEdit, onDelete, busy }) => {
  const state = promotionState(promotion, today);
  return (
    <article className="promotion-card">
      <div className="promotion-card-media">
        {promotion.imageUrl ? (
          <img src={promotion.imageUrl} alt={`${promotion.title} promotion`} />
        ) : (
          <div className="promotion-card-placeholder" aria-hidden="true">C</div>
        )}
        <span className={`promotion-status promotion-status-${state.toLowerCase()}`}>{state}</span>
      </div>
      <div className="promotion-card-body">
        <p className="promotion-location">{promotion.business}</p>
        <h2 className="promotion-card-title">{promotion.title}</h2>
        {promotion.offer ? <p className="promotion-offer">{promotion.offer}</p> : null}
        <p className="promotion-description">{promotion.description}</p>
        <p className="promotion-dates">
          {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
        </p>
        {isAdmin ? (
          <div className="promotion-card-actions">
            <Button type="button" variant="secondary" onClick={() => onEdit(promotion)} disabled={busy}>
              Edit
            </Button>
            <Button type="button" variant="ghost" onClick={() => onDelete(promotion)} disabled={busy}>
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
};

const Promotions = () => {
  const [session, setSession] = useState(() => getFromStorage(ADMIN_SESSION_KEY, null));
  const [promotions, setPromotions] = useState([]);
  const [form, setForm] = useState(newPromotionForm);
  const [editingId, setEditingId] = useState(null);
  const [showManager, setShowManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const today = toLocalDateValue(new Date());
  const isAdmin = Boolean(session?.loggedIn && getAdminToken());

  useEffect(() => {
    setPageSeo({
      title: 'Promotions',
      description: 'View current nail and spa promotions from Casabella Nail & Spa in Oviedo, Florida.',
      path: ROUTES.promotions,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPromotions = async () => {
      try {
        const items = await getPromotions();
        if (mounted) setPromotions(items);
      } catch (err) {
        if (mounted) {
          const message = err?.code === 'permission-denied'
            ? 'Promotions are being prepared. Please check back soon.'
            : 'Unable to load promotions right now. Please try again later.';
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadPromotions();
    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const visible = isAdmin ? promotions : promotions.filter((item) => item.isActive);
    return {
      current: visible.filter((item) => item.isActive && item.endDate >= today),
      inactive: isAdmin ? visible.filter((item) => !item.isActive && item.endDate >= today) : [],
      expired: visible.filter((item) => item.endDate < today),
    };
  }, [isAdmin, promotions, today]);

  const clearMessages = () => {
    setNotice('');
    setError('');
  };

  const resetForm = () => {
    setForm(newPromotionForm());
    setEditingId(null);
    clearMessages();
  };

  const handleField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearMessages();
  };

  const handleAuthError = (err) => {
    if (err?.status === 401 || err?.code === 'unauthenticated' || err?.code === 'permission-denied') {
      setAdminToken(null);
      saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
      setSession({ loggedIn: false });
      setShowManager(false);
      setError('Your session expired. Please sign in again.');
      return true;
    }
    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    if (!form.title.trim() || !form.description.trim() || !form.offer.trim() || !form.business.trim()) {
      setError('Complete the title, description, offer, and business fields.');
      return;
    }
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) {
      setError('Choose a valid date range. The end date cannot be before the start date.');
      return;
    }

    setSaving(true);
    try {
      const nextItems = editingId
        ? await updatePromotion(editingId, form)
        : await createPromotion(form);
      setPromotions(nextItems);
      setNotice(editingId ? 'Promotion updated.' : 'Promotion published.');
      setForm(newPromotionForm());
      setEditingId(null);
      setShowManager(false);
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Unable to save promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    clearMessages();
    setUploading(true);
    try {
      const imageUrl = await uploadPromotionImageFile(file);
      setForm((prev) => ({ ...prev, imageUrl }));
      setNotice('Poster uploaded. Save the promotion to publish it.');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Unable to upload poster.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleEdit = (promotion) => {
    setForm({
      title: promotion.title,
      description: promotion.description,
      offer: promotion.offer,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      business: promotion.business,
      imageUrl: promotion.imageUrl,
      isActive: promotion.isActive,
    });
    setEditingId(promotion.id);
    setShowManager(true);
    clearMessages();
    window.requestAnimationFrame(() => document.getElementById('promotion-manager')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const handleDelete = async (promotion) => {
    if (!window.confirm(`Delete "${promotion.title}"? This cannot be undone.`)) return;
    clearMessages();
    setSaving(true);
    try {
      const nextItems = await deletePromotion(promotion.id);
      setPromotions(nextItems);
      if (editingId === promotion.id) resetForm();
      setNotice('Promotion deleted.');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Unable to delete promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
      setSession({ loggedIn: false });
      setShowManager(false);
      resetForm();
    }
  };

  return (
    <div className="promotions-page">
      <Section
        eyebrow="Casabella Specials"
        title="Promotions"
        description="Current offers, seasonal specials, and limited-time ways to enjoy more at Casabella Nail & Spa."
        className="promotions-intro"
      >
        <div className="promotion-manager-bar">
          <div>
            <strong>{isAdmin ? `Signed in as ${session?.username || 'manager'}` : 'Business owner or manager?'}</strong>
            <p>{isAdmin ? 'Create, update, and organize offers from this page.' : 'Sign in to create and manage promotions.'}</p>
          </div>
          <div className="promotion-manager-actions">
            {isAdmin ? (
              <>
                <Button type="button" onClick={() => setShowManager((value) => !value)}>
                  {showManager ? 'Close Editor' : 'New Promotion'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleLogout}>Sign Out</Button>
              </>
            ) : (
              <Button to={ROUTES.adminLogin} state={{ from: ROUTES.promotions }} variant="secondary">
                Manager Sign In
              </Button>
            )}
          </div>
        </div>

        {isAdmin && showManager ? (
          <section id="promotion-manager" className="promotion-editor" aria-labelledby="promotion-editor-title">
            <div className="promotion-editor-header">
              <div>
                <p className="eyebrow">Promotion Manager</p>
                <h2 id="promotion-editor-title">{editingId ? 'Edit promotion' : 'Create a promotion'}</h2>
              </div>
              {editingId ? <span className="promotion-status promotion-status-active">Editing</span> : null}
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="promotion-form-grid">
                <FormField label="Promotion title" required>
                  <FormField.Input value={form.title} onChange={(e) => handleField('title', e.target.value)} placeholder="Summer spa special" />
                </FormField>
                <FormField label="Discount or offer" required>
                  <FormField.Input value={form.offer} onChange={(e) => handleField('offer', e.target.value)} placeholder="15% off deluxe pedicures" />
                </FormField>
                <FormField label="Start date" required>
                  <FormField.Input type="date" value={form.startDate} onChange={(e) => handleField('startDate', e.target.value)} />
                </FormField>
                <FormField label="End date" required>
                  <FormField.Input type="date" min={form.startDate} value={form.endDate} onChange={(e) => handleField('endDate', e.target.value)} />
                </FormField>
                <FormField label="Business / location" required>
                  <FormField.Input value={form.business} onChange={(e) => handleField('business', e.target.value)} />
                </FormField>
                <FormField label="Poster URL" helper="Optional if uploading a file below">
                  <FormField.Input type="url" value={form.imageUrl} onChange={(e) => handleField('imageUrl', e.target.value)} placeholder="https://..." />
                </FormField>
              </div>
              <FormField label="Description" required>
                <FormField.TextArea rows={4} value={form.description} onChange={(e) => handleField('description', e.target.value)} placeholder="Explain what is included and any important details." />
              </FormField>
              <div className="promotion-upload-row">
                <label className={`btn btn-secondary ${uploading ? 'is-disabled' : ''}`}>
                  {uploading ? 'Uploading...' : 'Upload Poster'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} disabled={uploading || saving} />
                </label>
                {form.imageUrl ? <img className="promotion-upload-preview" src={form.imageUrl} alt="Promotion poster preview" /> : null}
                <label className="promotion-active-toggle">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => handleField('isActive', e.target.checked)} />
                  <span>Active and visible to customers</span>
                </label>
              </div>
              {notice ? <p className="promotion-notice">{notice}</p> : null}
              {error ? <p className="field-error promotion-form-error">{error}</p> : null}
              <div className="promotion-form-actions">
                <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Promotion'}</Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Clear Form</Button>
              </div>
            </form>
          </section>
        ) : null}

        {!showManager && notice ? <p className="promotion-notice">{notice}</p> : null}
        {!showManager && error ? <p className="field-error promotion-form-error">{error}</p> : null}

        <div className="promotion-list-section">
          <div className="promotion-list-heading">
            <div>
              <p className="eyebrow">Available Now</p>
              <h2>Current promotions</h2>
            </div>
            <span>{groups.current.length} {groups.current.length === 1 ? 'offer' : 'offers'}</span>
          </div>
          {loading ? <p className="promotion-empty">Loading promotions...</p> : groups.current.length > 0 ? (
            <div className="promotion-grid">
              {groups.current.map((promotion) => <PromotionCard key={promotion.id} promotion={promotion} today={today} isAdmin={isAdmin} onEdit={handleEdit} onDelete={handleDelete} busy={saving} />)}
            </div>
          ) : (
            <div className="promotion-empty">No active promotions right now. Check back soon for the next Casabella special.</div>
          )}
        </div>

        {groups.inactive.length > 0 ? (
          <div className="promotion-list-section promotion-list-secondary">
            <div className="promotion-list-heading"><h2>Inactive promotions</h2><span>{groups.inactive.length}</span></div>
            <div className="promotion-grid">
              {groups.inactive.map((promotion) => <PromotionCard key={promotion.id} promotion={promotion} today={today} isAdmin={isAdmin} onEdit={handleEdit} onDelete={handleDelete} busy={saving} />)}
            </div>
          </div>
        ) : null}

        {groups.expired.length > 0 ? (
          <div className="promotion-list-section promotion-list-secondary">
            <div className="promotion-list-heading"><h2>Past promotions</h2><span>{groups.expired.length}</span></div>
            <div className="promotion-grid promotion-grid-expired">
              {groups.expired.map((promotion) => <PromotionCard key={promotion.id} promotion={promotion} today={today} isAdmin={isAdmin} onEdit={handleEdit} onDelete={handleDelete} busy={saving} />)}
            </div>
          </div>
        ) : null}
      </Section>
    </div>
  );
};

export default Promotions;
