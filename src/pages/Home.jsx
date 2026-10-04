import { useEffect, useMemo, useState } from 'react';
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
import { getPromotions } from '../utils/adminApi';
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

const directionsUrl = 'https://www.google.com/maps/search/?api=1&query=2871%20Clayton%20Crossing%20Way%20%231033%2C%20Oviedo%2C%20FL%2032765';

const toLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPromotionDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

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
      'Yes. Guests visit from Oviedo, Winter Springs, Chuluota, Geneva, Orlando, Winter Park, Casselberry, and surrounding Seminole County communities.',
  },
  {
    question: 'How far is Casabella Nail & Spa from Orlando?',
    answer:
      'Casabella Nail & Spa is in Oviedo, FL, about a 20-25 minute drive from downtown Orlando, making it an easy, less crowded option for Orlando-area nail and spa appointments.',
  },
];

const Home = () => {
  const services = useServices();
  const [promotions, setPromotions] = useState([]);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);
  const [showBookingPromo, setShowBookingPromo] = useState(false);
  const [bookingGateBusy, setBookingGateBusy] = useState(false);

  useEffect(() => {
    setPageSeo({
      title: 'Nail Salon in Oviedo, FL Near Orlando',
      description:
        'Casabella Nail & Spa is an Oviedo, FL nail salon near Orlando for manicures, pedicures, acrylic nails, dip powder, builder gel, Gel-X, nail art, waxing, and spa treatments.',
      path: '/',
      keywords:
        'nail salon Oviedo FL, best nail salon Oviedo, manicure Oviedo, pedicure Oviedo, acrylic nails Oviedo, dip powder Oviedo, Gel-X Oviedo, nail salon near Orlando',
    });
    setLocalBusinessJsonLd();
    setFaqJsonLd(localFaqs);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPromotions = async () => {
      try {
        const items = await getPromotions();
        if (mounted) setPromotions(items);
      } catch {
        if (mounted) setPromotions([]);
      } finally {
        if (mounted) setPromotionsLoaded(true);
      }
    };

    loadPromotions();
    return () => {
      mounted = false;
    };
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
  const activePromotion = useMemo(() => {
    const today = toLocalDateValue(new Date());
    return promotions.find((promotion) => (
      promotion.isActive &&
      promotion.startDate <= today &&
      promotion.endDate >= today
    ));
  }, [promotions]);

  const continueToBooking = () => {
    window.location.href = ROUTES.bookingExternal;
  };

  const findActivePromotion = (items) => {
    const today = toLocalDateValue(new Date());
    return items.find((promotion) => (
      promotion.isActive &&
      promotion.startDate <= today &&
      promotion.endDate >= today
    ));
  };

  const handleMobileBooking = async (event) => {
    event.preventDefault();
    if (bookingGateBusy) return;

    if (promotionsLoaded) {
      if (activePromotion) setShowBookingPromo(true);
      else continueToBooking();
      return;
    }

    setBookingGateBusy(true);
    try {
      const items = await getPromotions();
      setPromotions(items);
      setPromotionsLoaded(true);
      const nextActivePromotion = findActivePromotion(items);
      if (nextActivePromotion) {
        setShowBookingPromo(true);
      } else {
        continueToBooking();
      }
    } catch {
      continueToBooking();
    } finally {
      setBookingGateBusy(false);
    }
  };

  const closeBookingPromotion = () => {
    if (bookingGateBusy) return;
    setShowBookingPromo(false);
  };

  const handleContinueToBooking = () => {
    if (bookingGateBusy) return;
    setBookingGateBusy(true);
    continueToBooking();
  };

  return (
    <div className="home-page">
      <section className="mobile-app-home" aria-label="Casabella Nails and Spa mobile home">
        <div className="mobile-app-card">
          <img className="mobile-app-logo" src={logo} alt="Casabella Nails and Spa" />
          <h1>Casabella Nails &amp; Spa</h1>
          <p className="mobile-app-welcome">
            Welcome. Book your relaxing nail and spa visit in Oviedo.
          </p>
          <div className="mobile-app-actions" aria-label="Primary actions">
            <a className="mobile-app-action mobile-app-action-primary" href={ROUTES.bookingExternal} onClick={handleMobileBooking} aria-busy={bookingGateBusy}>
              {bookingGateBusy ? 'Checking Offers...' : 'Book Online'}
            </a>
            <a className="mobile-app-action" href="tel:+13214446297">
              Call Us
            </a>
            <a className="mobile-app-action" href={directionsUrl} target="_blank" rel="noreferrer">
              Get Directions
            </a>
            <a className="mobile-app-action" href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">
              Follow Us
            </a>
          </div>
        </div>
      </section>

      {showBookingPromo && activePromotion ? (
        <div className="mobile-booking-promo-backdrop" role="dialog" aria-modal="true" aria-labelledby="mobile-booking-promo-title">
          <div className="mobile-booking-promo-sheet">
            <button
              type="button"
              className="mobile-booking-promo-close"
              onClick={closeBookingPromotion}
              aria-label="Close promotion"
            >
              ×
            </button>
            {activePromotion.imageUrl ? (
              <img
                className="mobile-booking-promo-image"
                src={activePromotion.imageUrl}
                alt={`${activePromotion.title} promotion`}
              />
            ) : null}
            <div className="mobile-booking-promo-content">
              <p className="mobile-booking-promo-label">Current Promotion</p>
              <h2 id="mobile-booking-promo-title">{activePromotion.title}</h2>
              {activePromotion.offer ? <p className="mobile-booking-promo-offer">{activePromotion.offer}</p> : null}
              <p className="mobile-booking-promo-description">{activePromotion.description}</p>
              <p className="mobile-booking-promo-validity">
                Valid {formatPromotionDate(activePromotion.startDate)} - {formatPromotionDate(activePromotion.endDate)}
              </p>
              <button type="button" className="mobile-booking-promo-primary" onClick={handleContinueToBooking} disabled={bookingGateBusy}>
                {bookingGateBusy ? 'Opening...' : 'Continue to Booking'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="desktop-home-content">
        <div className="hero">
        <div className="container section-inner hero-grid hero-inner">
          <div className="hero-copy">
            <span className="pill hero-kicker">
              Oviedo, Florida
            </span>
            <h1 className="hero-title">Nail salon in Oviedo, FL, near Orlando, for polished manicures, pedicures, and spa care.</h1>
            <p className="hero-text">
              Casabella Nail & Spa is a modern, immaculate studio near Clayton Crossing, just a short drive from Orlando, delivering tailored manicures, spa pedicures, acrylic nails, dip powder, Gel-X, builder gel, nail art, waxing, and calming massage.
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
              Every $1 you spend earns 10 reward points. Check your rewards through Lux Loyalty by entering your phone number.
            </p>
            <div className="rewards-rate" aria-label="One dollar spent earns ten points">
              <strong>$1</strong>
              <span>spent</span>
              <b>=</b>
              <strong>10</strong>
              <span>points</span>
            </div>
            <ul className="rewards-benefits">
              <li>Tap “Check Reward” on Lux Loyalty.</li>
              <li>Enter your phone number to look up your account.</li>
              <li>See your current points and reward tier at a glance.</li>
              <li>Redeem points toward eligible services on a future visit.</li>
            </ul>
            <Button
              to={ROUTES.rewardsExternal}
              className="rewards-button"
              target="_blank"
              rel="noreferrer"
            >
              Check My Rewards
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
        title="Serving Oviedo, Orlando, and nearby Seminole County communities"
        description="Visit Casabella Nail & Spa at 2871 Clayton Crossing Way #1033 in Oviedo, FL 32765, about a 20-25 minute drive from downtown Orlando. Guests come to us from Oviedo, Orlando, Winter Springs, Chuluota, Geneva, Winter Park, Casselberry, and nearby neighborhoods for clean nail care and relaxing spa services."
      >
        <div className="grid-3">
          <Card className="reveal">
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Manicures and nail enhancements
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Classic and deluxe manicures, acrylic full sets, acrylic fills, dip powder, builder gel, Gel-X extensions, French tips, chrome, cat eye finishes, and custom nail art for Oviedo and Orlando-area guests.
            </p>
          </Card>
          <Card className="reveal reveal-delay-1">
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Spa pedicures in Oviedo
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Refresh, premium, deluxe glow, organic fresh, collagen smooth, volcano spa, espresso, and golden pedicures with gel polish and massage add-ons.
            </p>
          </Card>
          <Card className="reveal reveal-delay-2">
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Easy local appointments
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Call <a href="tel:+13214446297">(321) 444-6297</a> or book online for nail salon appointments near Oviedo on weekdays, Saturdays, and Sundays.
            </p>
          </Card>
          <Card className="reveal reveal-delay-3">
            <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
              Convenient for Orlando guests
            </h2>
            <p className="section-description" style={{ marginTop: '0.5rem' }}>
              Skip the downtown Orlando crowds—Casabella Nail & Spa offers the same premium manicures, pedicures, and spa care in a calmer, easy-to-reach Oviedo studio.
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
          {localFaqs.map((item, index) => (
            <Card key={item.question} className={`reveal${index ? ` reveal-delay-${index}` : ''}`}>
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
        <Card className="cta-strip reveal">
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
    </div>
  );
};

export default Home;
