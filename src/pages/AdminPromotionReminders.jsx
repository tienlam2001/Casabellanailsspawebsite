import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import { getAdminToken, getPromotionReminderSignups, logoutAdmin, setAdminToken } from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';

const formatDate = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Unknown time';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const AdminPromotionReminders = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDocumentTitle('Promotion Reminder Signups');
    setMetaDescription('Admin page for customer promotion reminder signup records.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!session?.loggedIn || !getAdminToken()) {
        setLoading(false);
        return;
      }

      try {
        const rows = await getPromotionReminderSignups();
        setSignups(rows);
      } catch (err) {
        if (err?.status === 401 || err?.code === 'unauthenticated') {
          setAdminToken(null);
          saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
          navigate(ROUTES.adminLogin, { replace: true });
          return;
        }
        setError(err.message || 'Unable to load promotion reminder signups.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, session?.loggedIn]);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminPromotionReminders }} />;
  }

  const onLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
      navigate(ROUTES.adminLogin, { replace: true });
    }
  };

  return (
    <Section
      eyebrow="Admin"
      title="Promotion Reminder Signups"
      description="Review customers who signed up to receive promotion reminders by phone or email."
    >
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <span className="pill">{signups.length} signup{signups.length === 1 ? '' : 's'}</span>
            </div>
            {error ? <p className="field-error" style={{ margin: 0 }}>{error}</p> : null}
            {loading ? (
              <p className="muted" style={{ margin: 0 }}>Loading signups...</p>
            ) : signups.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>No promotion reminder signups yet.</p>
            ) : (
              <div className="admin-record-list">
                {signups.map((signup) => (
                  <article key={signup.id} className="admin-record-card">
                    <div>
                      <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>{formatDate(signup.createdAt)}</p>
                      <h3 className="section-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                        {signup.firstName} {signup.lastName}
                      </h3>
                    </div>
                    <div className="admin-record-contact">
                      <a href={`tel:${signup.phone}`}>{signup.phone}</a>
                      <a href={`mailto:${signup.email}`}>{signup.email}</a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Admin Navigation</p>
          <h3 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Other admin tools</h3>
          <p className="muted" style={{ marginTop: '0.7rem' }}>
            Use this list when you are ready to send promotion reminders.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.adminAdvertise} variant="secondary">Go to Advertise</Button>
            <Button to={ROUTES.adminServices} variant="secondary">Go to Services Pricing</Button>
            <Button to={ROUTES.adminGallery} variant="secondary">Go to Gallery Manager</Button>
            <Button to={ROUTES.adminBlog} variant="secondary">Go to Blog Manager</Button>
            <Button to={ROUTES.promotionReminders} variant="ghost">Open Public Signup</Button>
            <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
          </div>
        </Card>
      </div>
    </Section>
  );
};

export default AdminPromotionReminders;
