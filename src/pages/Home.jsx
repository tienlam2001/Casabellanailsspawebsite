import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import testimonials from '../data/testimonials.json';
import posts from '../data/posts.json';
import Section from '../components/Section';
import Button from '../components/Button';
import Card from '../components/Card';
import ROUTES from '../constants/routes';
import { setDocumentTitle, setMetaDescription } from '../utils/seo';
import useServices from '../hooks/useServices';
import logo from '../assets/casalogo.png';
import nail1 from '../assets/nails/Nail1.png';
import nail2 from '../assets/nails/Nail2.png';
import nail3 from '../assets/nails/Nail3.png';
import nail4 from '../assets/interior/Interior1.png';


const whyUs = [
  {
    title: 'Immaculate Cleanliness',
    description: 'Hospital-grade sanitation at every station with individually wrapped tools.',
  },
  {
    title: 'Skilled Technicians',
    description: 'Detail-oriented artists who tailor each appointment to your preferences.',
  },
  {
    title: 'Relaxing Experience',
    description: 'Quiet, calm rooms with aromatherapy and gentle music to help you unwind.',
  },
  {
    title: 'Premium Products',
    description: 'We source gentle, long-wear formulas that respect nail health and skin.',
  },
];

const galleryPreview = [
  { src: nail1, alt: 'Neutral gel manicure' },
  { src: nail2, alt: 'Spa pedicure bowl' },
  { src: nail3, alt: 'Soft pink manicure' },
  { src: nail4, alt: 'Before and after nails' },
];

const Home = () => {
  const services = useServices();

  useEffect(() => {
    setDocumentTitle('Home');
    setMetaDescription('Casabella Nail & Spa in Oviedo, Florida offers luxury manicures, spa pedicures, and calming treatments in a pristine, boutique setting.');
  }, []);

  const featuredServices = services.slice(0, 4);
  const latestPosts = posts.slice(0, 3);

  return (
    <div>
      <div className="hero">
        <div className="container section-inner hero-grid hero-inner">
          <div className="hero-copy">
            <span className="pill hero-kicker">
              Oviedo, Florida
            </span>
            <h1 className="hero-title">Casabella Nail & Spa — luxury nail care and serene spa rituals.</h1>
            <p className="hero-text">
              A modern, immaculate studio delivering tailored manicures, spa pedicures, and calming massage. Experience the most relaxing hour of your week.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button to={ROUTES.bookingExternal} variant="primary">
                Book Now
              </Button>
              <Button to={ROUTES.services} variant="secondary">
                View Services
              </Button>
            </div>
            <div className="hero-badges">
              <span className="pill">Cleanliness-first</span>
              <span className="pill">Tailored care</span>
              <span className="pill">Premium products</span>
            </div>
          </div>
          <div className="hero-media">
            <Card className="image-card float">
              <img
                src={logo}
                alt="Calm spa interior"
              />
              <div className="image-overlay" />
              <div className="image-info">
                <div>
                  <p className="eyebrow" style={{ marginBottom: 0, color: '#fff' }}>
                    Casabella Nail & Spa
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Oviedo, Florida</p>
                </div>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--charcoal)', boxShadow: 'none' }}>
                  Appointments daily
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Section id="why" eyebrow="Why Casabella" title="Calm, meticulous care">
        <div className="grid-2">
          {whyUs.map((item) => (
            <Card key={item.title} className="reveal">
              <h3 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                {item.title}
              </h3>
              <p className="section-description" style={{ marginTop: '0.5rem' }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="services"
        eyebrow="Featured Services"
        title="Beautiful nails, thoughtfully executed"
        description="Explore client favorites—from immaculate gel manicures to spa pedicures crafted to relax."
      >
        <div className="grid-2">
          {featuredServices.map((service) => (
            <Card key={service.name} className="reveal">
              <div className="service-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.35rem', color: 'rgba(31,41,51,0.55)' }}>
                    {service.category}
                  </p>
                  <h3 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                    {service.name}
                  </h3>
                </div>
                <div className="service-price">
                  <p style={{ margin: 0 }}>${service.priceFrom}+</p>
                  <p style={{ margin: '0.2rem 0 0' }}>{service.duration}</p>
                </div>
              </div>
              <p className="section-description" style={{ marginTop: '0.75rem' }}>
                {service.shortDescription}
              </p>
            </Card>
          ))}
        </div>
        <div className="section-actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
          <p className="muted">Looking for something specific? We customize every appointment.</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button to={ROUTES.services} variant="secondary">
              View All Services
            </Button>
            <Button to={ROUTES.bookingExternal}>Book Now</Button>
          </div>
        </div>
      </Section>

      <Section eyebrow="Testimonials" title="Guests love the calm, upscale feel">
        <div className="grid-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="reveal">
              <div className="testimonial-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{testimonial.name}</p>
                  <p className="eyebrow" style={{ margin: '0.2rem 0 0', color: 'rgba(31,41,51,0.55)' }}>
                    {testimonial.service}
                  </p>
                </div>
                <div className="testimonial-rating">
                  {'★'.repeat(testimonial.rating)}
                  <span style={{ color: 'rgba(31,41,51,0.3)' }}>{'★'.repeat(5 - testimonial.rating)}</span>
                </div>
              </div>
              <p className="section-description" style={{ marginTop: '0.75rem' }}>
                “{testimonial.quote}”
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Gallery"
        title="Nails and spa moments"
        description="A glimpse into our calm studio and the refined finishes our Oviedo guests love."
      >
        <div className="gallery-grid">
          {galleryPreview.map((image) => (
            <Link to={ROUTES.gallery} key={image.src} className="reveal">
              <Card className="image-card" style={{ minHeight: '160px' }}>
                <img src={image.src} alt={image.alt} />
              </Card>
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button to={ROUTES.gallery} variant="secondary">
            View Full Gallery
          </Button>
        </div>
      </Section>

      <Section eyebrow="Journal" title="From the Casabella blog">
        <div className="grid-3">
          {latestPosts.map((post) => (
            <Card key={post.id} className="reveal">
              <p className="eyebrow" style={{ color: 'rgba(31,41,51,0.55)', marginBottom: '0.2rem' }}>
                {new Date(post.date).toLocaleDateString()}
              </p>
              <h3 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                {post.title}
              </h3>
              <p className="section-description" style={{ marginTop: '0.65rem' }}>
                {post.excerpt}
              </p>
              <div style={{ marginTop: 'auto' }}>
                <Button to={`${ROUTES.blog}/${post.slug}`} variant="ghost">
                  Read Post →
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button to={ROUTES.blog} variant="secondary">
            View All Posts
          </Button>
        </div>
      </Section>

      <Section>
        <Card className="cta-strip">
          <div>
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '0.35rem' }}>
              Ready when you are
            </p>
            <h3 className="section-title" style={{ color: '#fff', margin: 0, fontSize: '1.6rem' }}>
              Book your next visit to Oviedo&apos;s calmest nail spa.
            </h3>
            <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.85)' }}>
              Tell us your preferred time and service—we&apos;ll confirm quickly with a clean, prepared station.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.bookingExternal} variant="secondary">
              Book Now
            </Button>
            <Button to={ROUTES.contact} variant="ghost" className="btn-ghost" style={{ color: '#fff' }}>
              Contact
            </Button>
          </div>
        </Card>
      </Section>
    </div>
  );
};

export default Home;
