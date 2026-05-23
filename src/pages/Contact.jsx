import { useEffect, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { appendToStorage } from '../utils/storage';
import { validateContact } from '../utils/validators';
import { setLocalBusinessJsonLd, setPageSeo } from '../utils/seo';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  message: '',
};

const Contact = () => {
  useEffect(() => {
    setPageSeo({
      title: 'Contact Oviedo Nail Salon',
      description:
        'Contact Casabella Nail & Spa at 2871 Clayton Crossing Way #1033, Oviedo, FL 32765 for manicure, pedicure, nail art, waxing, and spa appointments.',
      path: ROUTES.contact,
    });
    setLocalBusinessJsonLd();
  }, []);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateContact(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    const entry = { ...form, createdAt: new Date().toISOString() };
    setTimeout(() => {
      appendToStorage('contactRequests', entry);
      setSubmitting(false);
      setSubmitted(true);
      setForm(initialForm);
    }, 350);
  };

  return (
    <div>
      <Section
        eyebrow="Contact"
        title="Contact Casabella Nail & Spa in Oviedo, FL"
        description="Call, email, or send a note to our nail salon at 2871 Clayton Crossing Way #1033, Oviedo, FL 32765. The Casabella team responds during business hours."
      >
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          <Card>
            {submitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <p className="eyebrow" style={{ color: 'var(--pine)', marginBottom: 0 }}>
                  Message received
                </p>
                <h3 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>
                  Thank you for reaching out.
                </h3>
                <p className="muted">
                  Our team will respond soon. For immediate questions, call (321) 444-6297.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Button to={ROUTES.bookingExternal}>Book an appointment</Button>
                  <Button variant="secondary" onClick={() => setSubmitted(false)}>
                    Send another note
                  </Button>
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
                    />
                  </FormField>
                  <FormField label="Phone" required error={errors.phone}>
                    <FormField.Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(321) 444-6297"
                    />
                  </FormField>
                </div>
                <FormField label="Email" required error={errors.email}>
                  <FormField.Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />
                </FormField>
                <FormField label="Message" required error={errors.message}>
                  <FormField.TextArea
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Share how we can support your visit."
                  />
                </FormField>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p className="muted" style={{ margin: 0 }}>
                    We reply quickly during open hours in Oviedo, Florida.
                  </p>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send message'}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
                Visit
              </p>
              <p className="muted" style={{ marginTop: 0 }}>
                Casabella Nail & Spa <br />
                2871 Clayton Crossing Way #1033 <br />
                Oviedo, FL 32765 <br />
                (321) 444-6297 <br />
                oviedonail@gmail.com
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>
                    Weekdays
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    9:30a – 7:00p
                  </p>
                </div>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>
                    Weekends
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Sat 9:30a – 6:00p <br />
                    Sun 11:00a – 5:00p
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.9rem' }}>
                <Button to={ROUTES.bookingExternal}>Book Now</Button>
                <Button to={ROUTES.services} variant="secondary">
                  Services
                </Button>
              </div>
            </Card>
            <Card style={{ padding: '0.75rem' }}>
              <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: '18px' }}>
                <iframe
                  title="Casabella Nail & Spa map"
                  src="https://www.google.com/maps?q=2871+Clayton+Crossing+Way+%231033,+Oviedo,+FL+32765&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="map-embed"
                />
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default Contact;
