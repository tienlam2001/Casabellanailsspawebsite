import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import testimonials from '../data/testimonials.json';
import posts from '../data/posts.json';
import instagramPosts from '../data/instagramPosts';
import Section from '../components/Section';
import Button from '../components/Button';
import Card from '../components/Card';
import InstagramFeed, { INSTAGRAM_PROFILE_URL } from '../components/InstagramFeed';
import ROUTES from '../constants/routes';
import { setFaqJsonLd, setLocalBusinessJsonLd, setPageSeo } from '../utils/seo';
import useServices from '../hooks/useServices';
import logo from '../assets/casalogo.png';
import nail1 from '../assets/nails/Nail1.png';
import nail2 from '../assets/nails/Nail2.png';
import nail3 from '../assets/nails/Nail3.png';
import nail4 from '../assets/interior/Interior1.png';
import rewardsPreview from '../assets/rewards-preview.png';


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

const rewardTiers = [
  { points: '1,000', reward: '$5' },
  { points: '1,500', reward: '$7' },
  { points: '1,750', reward: '$8' },
  { points: '2,000', reward: '$10' },
  { points: '2,500', reward: '$12' },
  { points: '5,000', reward: '$25' },
  { points: '10,000', reward: '$55' },
  { points: '15,000', reward: '$90' },
  { points: '20,000', reward: '$125' },
  { points: '25,000', reward: '$175' },
];

const localFaqs = [
  {
    question: 'Where is Casabella Nail & Spa located in Oviedo, FL?',
    answer:
      'Casabella Nail & Spa is located at 2871 Clayton Crossing Way #1033, Oviedo, FL 32765.',
  },
  {
    question: 'What nail services are available in Oviedo?',
    answer:
      'Casabella Nail & Spa offers manicures, spa pedicures, acrylic nails, dip powder, builder gel, Gel-X extensions, nail art, kids nail services, and waxing in Oviedo, Florida.',
  },
  {
    question: 'Do you serve nearby areas outside Oviedo?',
    answer:
      'Yes. Guests visit from Oviedo, Winter Springs, Chuluota, Geneva, Orlando, and surrounding Seminole County communities.',
  },
];

const Home = () => {
  const services = useServices();

  useEffect(() => {
    setPageSeo({
      title: 'Nail Salon in Oviedo, FL',
      description:
        'Casabella Nail & Spa is an Oviedo, FL nail salon for manicures, pedicures, acrylic nails, dip powder, builder gel, Gel-X, nail art, waxing, and spa treatments.',
      path: '/',
    });
    setLocalBusinessJsonLd();
    setFaqJsonLd(localFaqs);
  }, []);

  useEffect(() => {
    const root = document.querySelector('.home-page');
    if (!root) return undefined;

    const revealItems = Array.from(root.querySelectorAll('.reveal'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return undefined;
    }

    root.classList.add('motion-ready');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));

    let frameId = 0;
    const updateHeroDrift = () => {
      const drift = Math.min(window.scrollY * 0.025, 14);
      root.style.setProperty('--hero-drift', `${drift}px`);
      frameId = 0;
    };
    const handleScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateHeroDrift);
    };

    updateHeroDrift();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const featuredServices = services.slice(0, 4);
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="home-page">
      <div className="hero">
        <div className="container section-inner hero-grid hero-inner">
          <div className="hero-copy">
            <span className="pill hero-kicker">
              Oviedo, Florida
            </span>
            <h1 className="hero-title">Nail salon in Oviedo, FL for polished manicures, pedicures, and spa care.</h1>
            <p className="hero-text">
              Casabella Nail & Spa is a modern, immaculate studio near Clayton Crossing delivering tailored manicures, spa pedicures, acrylic nails, dip powder, Gel-X, builder gel, nail art, waxing, and calming massage.
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

      <section id="rewards" className="rewards-section" aria-labelledby="rewards-heading">
        <div className="container rewards-grid">
          <div className="rewards-copy reveal">
            <p className="eyebrow rewards-eyebrow">Casabella Rewards</p>
            <h2 id="rewards-heading" className="section-title rewards-title">
              Earn Points Every Time You Visit
            </h2>
            <p className="rewards-description">
              Every $1 you spend earns 10 reward points. Save your points and redeem them toward future services.
            </p>
            <div className="rewards-rate" aria-label="One dollar spent earns ten points">
              <strong>$1</strong>
              <span>spent</span>
              <b>=</b>
              <strong>10</strong>
              <span>points</span>
            </div>
            <ul className="rewards-benefits">
              <li>See your current points and reward tier at a glance.</li>
              <li>Redeem points toward eligible services on a future visit.</li>
              <li>Access rewards and referral details on mobile or the web.</li>
            </ul>
            <Button
              type="button"
              disabled
              className="rewards-button"
            >
              Coming Soon
            </Button>
          </div>

          <div className="rewards-visual reveal reveal-delay-1">
            <div className="rewards-device">
              <img
                src={rewardsPreview}
                alt="Mobile rewards page showing point tiers, account benefits, and referral tools"
              />
            </div>
            <p className="rewards-image-caption">Your points, perks, and referrals in one easy view.</p>
          </div>
        </div>

        <div className="container rewards-redemption reveal">
          <div className="rewards-redemption-copy">
            <p className="eyebrow rewards-eyebrow">Reward Chart</p>
            <h3>Turn your points into service credit</h3>
            <p>
              Keep saving or redeem when you reach any reward level. Ask our team to apply your available reward at checkout.
            </p>
          </div>
          <div className="rewards-chart-panel">
            <div className="rewards-chart-grid">
              {[rewardTiers.slice(0, 5), rewardTiers.slice(5)].map((tiers, index) => (
                <table className="rewards-table" key={`reward-tiers-${index}`}>
                  <thead>
                    <tr>
                      <th scope="col">Points</th>
                      <th scope="col">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier) => (
                      <tr key={tier.points}>
                        <td>{tier.points}</td>
                        <td>{tier.reward}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </div>
        </div>
      </section>

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
        eyebrow="Local Nail Salon"
        title="Serving Oviedo and nearby Seminole County communities"
        description="Visit Casabella Nail & Spa at 2871 Clayton Crossing Way #1033 in Oviedo, FL 32765. Guests come to us from Oviedo, Winter Springs, Chuluota, Geneva, Orlando, and nearby neighborhoods for clean nail care and relaxing spa services."
      >
        <div className="grid-3">
          <Card>
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Manicures and nail enhancements
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Classic and deluxe manicures, acrylic full sets, acrylic fills, dip powder, builder gel, Gel-X extensions, French tips, chrome, cat eye finishes, and custom nail art in Oviedo.
            </p>
          </Card>
          <Card>
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Spa pedicures in Oviedo
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Refresh, premium, deluxe glow, organic fresh, collagen smooth, volcano spa, espresso, and golden pedicures with gel polish and massage add-ons.
            </p>
          </Card>
          <Card>
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Easy local appointments
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Call <a href="tel:+13214446297">(321) 444-6297</a> or book online for nail salon appointments near Oviedo on weekdays, Saturdays, and Sundays.
            </p>
          </Card>
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

      <Section
        eyebrow="Instagram"
        title="Recent looks from @casabellaoviedoo"
        description="See fresh nail sets, spa details, and client-ready inspiration from our Oviedo studio."
      >
        <InstagramFeed posts={instagramPosts} />
        <div className="instagram-actions">
          <Button to={INSTAGRAM_PROFILE_URL} variant="secondary" target="_blank" rel="noreferrer">
            Follow on Instagram
          </Button>
        </div>
      </Section>

      <Section eyebrow="Local FAQ" title="Oviedo nail salon questions">
        <div className="grid-3">
          {localFaqs.map((item) => (
            <Card key={item.question}>
              <h2 className="section-title" style={{ fontSize: '1.15rem', margin: 0 }}>
                {item.question}
              </h2>
              <p className="section-description" style={{ marginTop: '0.5rem' }}>
                {item.answer}
              </p>
            </Card>
          ))}
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
