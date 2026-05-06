import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { isNotEmpty } from '../utils/validators';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import ROUTES from '../constants/routes';
import { getAdminToken, setAdminToken, updateWelcomeOffer, uploadOfferImageFile } from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';
const OFFER_CONTENT_KEY = 'welcomeOfferContent';

const defaultContent = {
  badge: 'Limited-time perks',
  kicker: 'Welcome to Casabella',
  title: 'New offers every week',
  message: 'Check back often for fresh promotions on your favorite nail and spa treatments.',
  ctaLabel: 'View Offers',
  ctaPath: '/services',
  imageUrl: '',
  slidesJson: '',
  slideDurationMs: 5000,
};

const AdminAdvertise = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const storedContent = useMemo(
    () => {
      const stored = getFromStorage(OFFER_CONTENT_KEY, {}) || {};
      return {
        ...defaultContent,
        ...stored,
        slidesJson: Array.isArray(stored.slides) ? JSON.stringify(stored.slides, null, 2) : '',
      };
    },
    []
  );

  const [form, setForm] = useState(storedContent);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDocumentTitle('Admin Advertise');
    setMetaDescription('Admin panel for weekly offer popup settings.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminAdvertise }} />;
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setNotice('');
  };

  const onSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!isNotEmpty(form.badge)) nextErrors.badge = 'Badge is required';
    if (!isNotEmpty(form.kicker)) nextErrors.kicker = 'Kicker is required';
    if (!isNotEmpty(form.title)) nextErrors.title = 'Title is required';
    if (!isNotEmpty(form.message)) nextErrors.message = 'Message is required';
    if (!isNotEmpty(form.ctaLabel)) nextErrors.ctaLabel = 'CTA label is required';
    if (!isNotEmpty(form.ctaPath)) nextErrors.ctaPath = 'CTA path is required';
    const rawDuration = Number(form.slideDurationMs);
    if (!Number.isFinite(rawDuration) || rawDuration < 1000 || rawDuration > 60000) {
      nextErrors.slideDurationMs = 'Duration must be between 1000 and 60000 ms.';
    }
    let parsedSlides = [];
    const slidesRaw = String(form.slidesJson || '').trim();
    if (slidesRaw) {
      try {
        parsedSlides = JSON.parse(slidesRaw);
        if (!Array.isArray(parsedSlides)) {
          nextErrors.slidesJson = 'Slides JSON must be an array.';
        }
      } catch {
        nextErrors.slidesJson = 'Slides JSON is not valid.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const token = getAdminToken();
      if (!token) {
        setNotice('Your admin session expired. Please log in again.');
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      const payload = {
        badge: form.badge,
        kicker: form.kicker,
        title: form.title,
        message: form.message,
        ctaLabel: form.ctaLabel,
        ctaPath: form.ctaPath,
        imageUrl: String(form.imageUrl || '').trim(),
        slideDurationMs: Math.round(Number(form.slideDurationMs)),
        slides: parsedSlides,
      };
      const saved = await updateWelcomeOffer(payload);
      setForm((prev) => ({ ...prev, slidesJson: JSON.stringify(parsedSlides, null, 2) }));
      saveToStorage(OFFER_CONTENT_KEY, saved);
      setNotice('Saved. Refresh with ?previewOffer=1 to preview popup immediately.');
    } catch (err) {
      if (err.status === 401) {
        setAdminToken(null);
        saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      setNotice(err.message || 'Unable to save changes.');
    }
  };

  const onUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice('');
    setUploading(true);
    try {
      const token = getAdminToken();
      if (!token) {
        setNotice('Your admin session expired. Please log in again.');
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      const url = await uploadOfferImageFile(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      setNotice('Popup image uploaded. Click Save Changes to publish.');
    } catch (err) {
      setNotice(err.message || 'Unable to upload popup image.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const onReset = () => {
    setForm(defaultContent);
    setErrors({});
    setNotice('Defaults restored in form. Click Save to publish.');
  };

  const onLogout = () => {
    setAdminToken(null);
    saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
    navigate(ROUTES.adminLogin, { replace: true });
  };

  return (
    <Section
      eyebrow="Admin"
      title="Advertise Popup Settings"
      description="Edit the first-visit popup content used for weekly offers."
    >
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={onSave} noValidate>
            <FormField label="Badge" required error={errors.badge}>
              <FormField.Input name="badge" value={form.badge} onChange={onChange} />
            </FormField>
            <FormField label="Kicker" required error={errors.kicker}>
              <FormField.Input name="kicker" value={form.kicker} onChange={onChange} />
            </FormField>
            <FormField label="Title" required error={errors.title}>
              <FormField.Input name="title" value={form.title} onChange={onChange} />
            </FormField>
            <FormField label="Message" required error={errors.message}>
              <FormField.TextArea name="message" rows={4} value={form.message} onChange={onChange} />
            </FormField>
            <FormField label="Image URL" helper="Optional: single-image popup background">
              <FormField.Input
                name="imageUrl"
                value={form.imageUrl || ''}
                onChange={onChange}
                placeholder="https://..."
              />
            </FormField>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="btn btn-secondary" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? 'Uploading...' : 'Upload Popup Image'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onUploadImage}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="muted" style={{ margin: 0 }}>Auto-converts to WebP and uploads to Firebase Storage.</p>
            </div>
            <FormField label="Slides JSON" error={errors.slidesJson} helper="Optional: array of slides with title/message/cta/imageUrl">
              <FormField.TextArea
                name="slidesJson"
                rows={8}
                value={form.slidesJson || ''}
                onChange={onChange}
                placeholder={'[{"title":"Offer 1","message":"...","ctaLabel":"Book","ctaPath":"/booking","imageUrl":"https://..."}]'}
              />
            </FormField>
            <FormField label="Slide Duration (ms)" error={errors.slideDurationMs} helper="Used for auto-slide when there are 2+ slides.">
              <FormField.Input
                name="slideDurationMs"
                type="number"
                min="1000"
                max="60000"
                step="500"
                value={form.slideDurationMs}
                onChange={onChange}
              />
            </FormField>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <FormField label="CTA Label" required error={errors.ctaLabel}>
                <FormField.Input name="ctaLabel" value={form.ctaLabel} onChange={onChange} />
              </FormField>
              <FormField label="CTA Path" required helper="Example: /services" error={errors.ctaPath}>
                <FormField.Input name="ctaPath" value={form.ctaPath} onChange={onChange} />
              </FormField>
            </div>
            {notice ? <p className="muted" style={{ margin: 0 }}>{notice}</p> : null}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="secondary" onClick={onReset}>Reset Form</Button>
              </div>
              <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>How to use</p>
          <h3 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Publish and preview quickly</h3>
          <ol style={{ marginTop: '0.8rem', color: 'rgba(31,41,51,0.9)', lineHeight: 1.6, paddingLeft: '1.2rem' }}>
            <li>Update the popup text fields.</li>
            <li>Click Save Changes.</li>
            <li>Open the site with <code>?previewOffer=1</code> to force the popup open.</li>
            <li>Remove the query param for normal behavior.</li>
          </ol>
          <p className="muted" style={{ marginBottom: 0 }}>
            Popup content is saved to the backend and published globally.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.adminServices} variant="secondary">Go to Services Pricing</Button>
            <Button to={ROUTES.adminGallery} variant="secondary">Go to Gallery Manager</Button>
            <Button to={ROUTES.adminBlog} variant="secondary">Go to Blog Manager</Button>
          </div>
        </Card>
      </div>
    </Section>
  );
};

export default AdminAdvertise;
