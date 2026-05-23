import { useEffect, useMemo, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import services from '../data/services.json';
import { appendToStorage } from '../utils/storage';
import { validateBooking } from '../utils/validators';
import { setLocalBusinessJsonLd, setPageSeo } from '../utils/seo';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  serviceCategory: '',
  notes: '',
};

const Booking = () => {
  useEffect(() => {
    setPageSeo({
      title: 'Book Nail Appointment in Oviedo, FL',
      description:
        'Book a manicure, pedicure, acrylic, dip powder, Gel-X, waxing, or spa service at Casabella Nail & Spa in Oviedo, FL. Request your preferred appointment time.',
      path: ROUTES.booking,
    });
    setLocalBusinessJsonLd();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category))),
    []
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateBooking(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    const entry = { ...form, createdAt: new Date().toISOString() };
    setTimeout(() => {
      appendToStorage('bookingRequests', entry);
      setSubmitted(entry);
      setSubmitting(false);
      setForm(initialForm);
    }, 350);
  };

  const resetForm = () => {
    setSubmitted(null);
    setErrors({});
  };

  return (
    <div>
      <Section
        eyebrow="Booking"
        title="Book a nail appointment in Oviedo, FL"
        description="Tell us when you would like to visit our Oviedo nail salon and which service you prefer. We confirm quickly with a clean, prepared station."
      >
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <Card>
            {submitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p className="eyebrow" style={{ color: 'var(--pine)', marginBottom: 0 }}>
                  Booking Request Sent
                </p>
                <h3 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>
                  Thank you, {submitted.fullName}.
                </h3>
                <p className="muted">
                  We will confirm your appointment by phone or email. If you need to adjust anything,
                  call us at <a href="tel:+13214446297">(321) 444-6297</a>.
                </p>
                <div
                  className="card"
                  style={{ background: 'rgba(216,182,103,0.05)', borderColor: 'rgba(216,182,103,0.15)', display: 'grid', gap: '0.75rem' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem' }}>
                    <div>
                      <p className="eyebrow" style={{ marginBottom: '0.15rem' }}>
                        Preferred Date
                      </p>
                      <p className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                        {submitted.preferredDate}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow" style={{ marginBottom: '0.15rem' }}>
                        Preferred Time
                      </p>
                      <p className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                        {submitted.preferredTime}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow" style={{ marginBottom: '0.15rem' }}>
                        Service Category
                      </p>
                      <p className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                        {submitted.serviceCategory}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow" style={{ marginBottom: '0.15rem' }}>
                        Email
                      </p>
                      <p className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                        {submitted.email}
                      </p>
                    </div>
                  </div>
                  {submitted.notes ? (
                    <p className="muted" style={{ margin: 0 }}>
                      <strong style={{ color: 'var(--charcoal)' }}>Notes:</strong> {submitted.notes}
                    </p>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Button to={ROUTES.services} variant="secondary">
                    View Services
                  </Button>
                  <Button onClick={resetForm}>Book another time</Button>
                </div>
              </div>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }} onSubmit={handleSubmit} noValidate>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  <FormField label="Full name" required error={errors.fullName}>
                    <FormField.Input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </FormField>
                  <FormField label="Phone" required error={errors.phone}>
                    <FormField.Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(407) 555-0123"
                      autoComplete="tel"
                    />
                  </FormField>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  <FormField label="Email" required error={errors.email}>
                    <FormField.Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </FormField>
                  <FormField label="Service category" required error={errors.serviceCategory}>
                    <FormField.Select
                      name="serviceCategory"
                      value={form.serviceCategory}
                      onChange={handleChange}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </FormField.Select>
                  </FormField>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <FormField label="Preferred date" required error={errors.preferredDate}>
                    <FormField.Input
                      name="preferredDate"
                      type="date"
                      value={form.preferredDate}
                      onChange={handleChange}
                    />
                  </FormField>
                  <FormField label="Preferred time" required error={errors.preferredTime}>
                    <FormField.Input
                      name="preferredTime"
                      type="time"
                      value={form.preferredTime}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>
                <FormField label="Notes" helper="Allergies, design ideas, or accessibility needs">
                  <FormField.TextArea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Share any preferences so we can prepare."
                    rows={4}
                  />
                </FormField>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p className="muted" style={{ margin: 0 }}>
                    You will receive a confirmation for Casabella Nail & Spa in Oviedo, Florida.
                  </p>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Request'}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card>
              <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>
                What to expect
              </p>
              <h3 className="section-title" style={{ fontSize: '1.3rem', margin: 0 }}>
                Calm, clean, and on time.
              </h3>
              <ul style={{ marginTop: '0.75rem', paddingLeft: '1rem', color: 'rgba(31,41,51,0.8)', lineHeight: 1.6 }}>
                <li>Hospital-grade sanitation with freshly wrapped tools.</li>
                <li>Premium long-wear finishes and meticulous prep.</li>
                <li>Tailored pressure and aromatherapy for spa services.</li>
                <li>Parking available; arrive 5 minutes early to unwind.</li>
              </ul>
            </Card>
            <Card>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
                Visit us
              </p>
              <p className="muted" style={{ marginTop: 0 }}>
                Oviedo, Florida <br />
                <a href="tel:+13214446297">(321) 444-6297</a> <br />
                oviedonail@gmail.com
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>
                    Weekdays
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    9:00a – 7:00p
                  </p>
                </div>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>
                    Weekends
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Sat 9:00a – 6:00p <br />
                    Sun 11:00a – 5:00p
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default Booking;
