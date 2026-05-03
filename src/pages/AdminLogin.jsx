import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import ROUTES from '../constants/routes';
import { loginAdmin, setAdminToken } from '../utils/adminApi';

const ADMIN_USER = 'admin';
const ADMIN_SESSION_KEY = 'adminSession';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingSession = getFromStorage(ADMIN_SESSION_KEY, null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDocumentTitle('Admin Login');
    setMetaDescription('Admin login for Casabella marketing content updates.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  if (existingSession?.loggedIn) {
    return <Navigate to={ROUTES.adminAdvertise} replace />;
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await loginAdmin(form);
      setAdminToken(result.token);
      saveToStorage(ADMIN_SESSION_KEY, {
        loggedIn: true,
        username: result.username || ADMIN_USER,
        loginAt: new Date().toISOString(),
      });
      const nextPath = location.state?.from || ROUTES.adminAdvertise;
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section eyebrow="Admin" title="Sign in" description="Login to update weekly offer advertising shown in the popup.">
      <div className="container" style={{ maxWidth: '620px', padding: 0 }}>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={onSubmit} noValidate>
            <FormField label="Admin Email" required>
              <FormField.Input
                name="email"
                type="email"
                value={form.email || form.username}
                onChange={onChange}
                autoComplete="email"
                placeholder="admin@example.com"
              />
            </FormField>
            <FormField label="Password" required>
              <FormField.Input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
                placeholder="Enter password"
              />
            </FormField>
            {error ? <p className="field-error" style={{ margin: 0 }}>{error}</p> : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <p className="muted" style={{ margin: 0 }}>Use your configured admin credentials.</p>
              <Button type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign In'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </Section>
  );
};

export default AdminLogin;
