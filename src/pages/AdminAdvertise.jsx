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
  ctaLabel: 'View More Details',
  ctaPath: ROUTES.promotions,
  imageUrl: '',
  slidesJson: '',
  slideDurationMs: 5000,
};

const normalizeSlide = (slide, fallback = defaultContent) => ({
  badge: String(slide?.badge || fallback.badge || '').trim(),
  kicker: String(slide?.kicker || fallback.kicker || '').trim(),
  title: String(slide?.title || '').trim(),
  message: String(slide?.message || '').trim(),
  ctaLabel: String(slide?.ctaLabel || fallback.ctaLabel || '').trim(),
  ctaPath: String(slide?.ctaPath || fallback.ctaPath || '').trim(),
  imageUrl: String(slide?.imageUrl || '').trim(),
});

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
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(-1);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [slidesEditor, setSlidesEditor] = useState(() => {
    const parsed = Array.isArray(storedContent?.slides) ? storedContent.slides : [];
    return parsed.map((slide) => normalizeSlide(slide, storedContent));
  });

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
    const rawDuration = Number(form.slideDurationMs);
    if (!Number.isFinite(rawDuration) || rawDuration < 1000 || rawDuration > 60000) {
      nextErrors.slideDurationMs = 'Duration must be between 1000 and 60000 ms.';
    }
    const parsedSlides = slidesEditor
      .map((slide) => normalizeSlide(slide, form))
      .filter((slide) => isNotEmpty(slide.title) && isNotEmpty(slide.message));

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
        ctaLabel: 'View More Details',
        ctaPath: ROUTES.promotions,
        imageUrl: String(form.imageUrl || '').trim(),
        slideDurationMs: Math.round(Number(form.slideDurationMs)),
        slides: parsedSlides,
      };
      const saved = await updateWelcomeOffer(payload);
      setForm((prev) => ({ ...prev, slidesJson: JSON.stringify(parsedSlides, null, 2) }));
      setSlidesEditor(parsedSlides.map((slide) => normalizeSlide(slide, form)));
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

  const onSlideFieldChange = (index, field, value) => {
    setSlidesEditor((prev) => prev.map((slide, idx) => (
      idx === index ? { ...slide, [field]: value } : slide
    )));
    setNotice('');
  };

  const onAddSlide = () => {
    setSlidesEditor((prev) => ([
      ...prev,
      normalizeSlide({ title: 'New offer title', message: 'Add your offer details here.' }, form),
    ]));
    setActivePreviewIndex(slidesEditor.length);
    setNotice('');
  };

  const onDeleteSlide = (index) => {
    setSlidesEditor((prev) => prev.filter((_, idx) => idx !== index));
    setActivePreviewIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setNotice('');
  };

  const onUploadSlideImage = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice('');
    setUploadingSlideIndex(index);
    try {
      const token = getAdminToken();
      if (!token) {
        setNotice('Your admin session expired. Please log in again.');
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      const url = await uploadOfferImageFile(file);
      onSlideFieldChange(index, 'imageUrl', url);
      setNotice('Slide image uploaded. Click Save Changes to publish.');
    } catch (err) {
      setNotice(err.message || 'Unable to upload slide image.');
    } finally {
      setUploadingSlideIndex(-1);
      event.target.value = '';
    }
  };

  const onReset = () => {
    setForm(defaultContent);
    setSlidesEditor([]);
    setActivePreviewIndex(0);
    setErrors({});
    setNotice('Defaults restored in form. Click Save to publish.');
  };

  const previewSlides = slidesEditor.length > 0
    ? slidesEditor
    : [{ ...normalizeSlide(form, form), title: form.title, message: form.message, imageUrl: form.imageUrl }];
  const previewSlide = previewSlides[Math.min(activePreviewIndex, previewSlides.length - 1)];

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
            <div className="popup-editor-header">
              <p className="eyebrow" style={{ margin: 0 }}>Slides</p>
              <button type="button" className="popup-editor-add-btn" onClick={onAddSlide}>+ Add Slide</button>
            </div>
            <div className="popup-slides-editor">
              {slidesEditor.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No slides yet. Click + Add Slide to create digital signage slides.</p>
              ) : slidesEditor.map((slide, index) => (
                <div key={`${slide.title}-${index}`} className="popup-slide-item">
                  <div className="popup-slide-item-top">
                    <strong>Slide {index + 1}</strong>
                    <button type="button" className="popup-slide-delete-btn" onClick={() => onDeleteSlide(index)}>×</button>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
                    <FormField label="Title">
                      <FormField.Input value={slide.title} onChange={(e) => onSlideFieldChange(index, 'title', e.target.value)} />
                    </FormField>
                    <FormField label="Message">
                      <FormField.Input value={slide.message} onChange={(e) => onSlideFieldChange(index, 'message', e.target.value)} />
                    </FormField>
                    <FormField label="Image URL">
                      <FormField.Input value={slide.imageUrl || ''} onChange={(e) => onSlideFieldChange(index, 'imageUrl', e.target.value)} placeholder="https://..." />
                    </FormField>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <label className="btn btn-secondary" style={{ cursor: uploadingSlideIndex === index ? 'not-allowed' : 'pointer', opacity: uploadingSlideIndex === index ? 0.7 : 1 }}>
                      {uploadingSlideIndex === index ? 'Uploading...' : 'Upload Slide Photo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => onUploadSlideImage(index, e)}
                        disabled={uploadingSlideIndex === index}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button type="button" className="btn btn-ghost" onClick={() => setActivePreviewIndex(index)}>Preview</button>
                  </div>
                  {slide.imageUrl ? (
                    <img className="popup-slide-thumb" src={slide.imageUrl} alt={`Slide ${index + 1} preview`} />
                  ) : null}
                </div>
              ))}
            </div>
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
            <div className="promotion-popup-link-note">
              <strong>Popup details link</strong>
              <span>“View More Details” opens the Promotions page automatically.</span>
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
          <h3 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Live Popup Preview</h3>
          <div className="popup-preview-card">
            {previewSlide?.imageUrl ? <img src={previewSlide.imageUrl} alt={previewSlide.title || 'Popup preview'} /> : null}
            <div className="popup-preview-content">
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{previewSlide?.kicker || form.kicker}</p>
              <h4>{previewSlide?.title || form.title}</h4>
              <p>{previewSlide?.message || form.message}</p>
              <p className="muted" style={{ marginBottom: 0 }}>Duration: {Math.round(Number(form.slideDurationMs || 5000) / 1000)}s</p>
            </div>
          </div>
          {previewSlides.length > 1 ? (
            <div className="popup-preview-dots">
              {previewSlides.map((_, index) => (
                <button
                  key={`preview-dot-${index}`}
                  type="button"
                  className={`welcome-slide-dot ${index === activePreviewIndex ? 'active' : ''}`}
                  onClick={() => setActivePreviewIndex(index)}
                  aria-label={`Preview slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
          <h3 className="section-title" style={{ margin: '1rem 0 0', fontSize: '1.2rem' }}>Publish and preview quickly</h3>
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
            <Button to={ROUTES.promotions} variant="secondary">Go to Promotions</Button>
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
