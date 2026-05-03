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
import { getAdminToken, setAdminToken, updateWelcomeOffer } from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';
const OFFER_CONTENT_KEY = 'welcomeOfferContent';

const defaultContent = {
  badge: 'Limited-time perks',
  kicker: 'Welcome to Casabella',
  title: 'New offers every week',
  message: 'Check back often for fresh promotions on your favorite nail and spa treatments.',
  ctaLabel: 'View Offers',
  ctaPath: '/services',
};

const AdminAdvertise = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const storedContent = useMemo(
    () => ({ ...defaultContent, ...(getFromStorage(OFFER_CONTENT_KEY, {}) || {}) }),
    []
  );

  const [form, setForm] = useState(storedContent);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState({});

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

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const token = getAdminToken();
      if (!token) {
        setNotice('Your admin session expired. Please log in again.');
        navigate(ROUTES.adminLogin, { replace: true });
        return;
      }
      const saved = await updateWelcomeOffer(form);
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
          </div>
        </Card>
      </div>
    </Section>
  );
};

export default AdminAdvertise;
