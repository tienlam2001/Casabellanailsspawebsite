import { useEffect, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { setLocalBusinessJsonLd, setPageSeo } from '../utils/seo';
import { validatePromotionReminderSignup } from '../utils/validators';
import { createPromotionReminderSignup } from '../utils/adminApi';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

const PromotionReminderSignup = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setPageSeo({
      title: 'Sign Up for Promotion Reminders',
      description:
        'Sign up for Casabella Nail & Spa promotion reminders and receive updates about seasonal offers and nail salon specials in Oviedo, Florida.',
      path: ROUTES.promotionReminders,
      keywords:
        'nail salon promotion reminders Oviedo, Casabella Nail Spa specials, Oviedo nail salon offers, manicure deals text signup, pedicure promotion reminders',
    });
    setLocalBusinessJsonLd();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validation = validatePromotionReminderSignup(form);
    setErrors(validation);
    setSubmitError('');
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    try {
      await createPromotionReminderSignup(form);
      setSubmitted(true);
      setForm(initialForm);
    } catch (error) {
      setSubmitError(error.message || 'Unable to save your signup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section
      eyebrow="Promotion Reminders"
      title="Sign Up to Get Promotion Reminders"
      description="Join our reminder list for seasonal specials and upcoming Casabella Nail & Spa promotions."
    >
      <div className="container" style={{ maxWidth: '760px', padding: 0 }}>
        <Card>
          {submitted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <p className="eyebrow" style={{ color: 'var(--pine)', marginBottom: 0 }}>
                You are on the list
              </p>
              <h3 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>
                Thank you for signing up.
              </h3>
              <p className="muted">
                We will use your contact information to send promotion reminders and seasonal updates.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button to={ROUTES.bookingExternal}>Book an appointment</Button>
                <Button type="button" variant="secondary" onClick={() => setSubmitted(false)}>
                  Add another signup
                </Button>
              </div>
            </div>
          ) : (
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }} onSubmit={onSubmit} noValidate>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <FormField label="First name" required error={errors.firstName}>
                  <FormField.Input
                    name="firstName"
                    value={form.firstName}
                    onChange={onChange}
                    autoComplete="given-name"
                    placeholder="First name"
                  />
                </FormField>
                <FormField label="Last name" required error={errors.lastName}>
                  <FormField.Input
                    name="lastName"
                    value={form.lastName}
                    onChange={onChange}
                    autoComplete="family-name"
                    placeholder="Last name"
                  />
                </FormField>
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <FormField label="Email address" required error={errors.email}>
                  <FormField.Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </FormField>
                <FormField label="Phone number" required error={errors.phone}>
                  <FormField.Input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={onChange}
                    autoComplete="tel"
                    placeholder="(321) 444-6297"
                  />
                </FormField>
              </div>
              {submitError ? <p className="field-error" style={{ margin: 0 }}>{submitError}</p> : null}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <p className="muted" style={{ margin: 0 }}>
                  We only ask for the information needed to send promotion reminders.
                </p>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Signing up...' : 'Sign Up'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </Section>
  );
};

export default PromotionReminderSignup;
