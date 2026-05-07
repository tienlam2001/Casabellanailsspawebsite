import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';
import { getFromStorage, saveToStorage } from '../utils/storage';
import ROUTES from '../constants/routes';
import logo from '../assets/casalogo.png';
import offerImage from '../assets/nails/783990E5-9AE8-4718-A1C7-E200A4B6DE1A_4_5005_c.jpeg';
import { getWelcomeOffer } from '../utils/adminApi';

const DISMISS_KEY = 'welcomeOfferDismissed';
const OFFER_CONTENT_KEY = 'welcomeOfferContent';

const defaultOffer = {
  badge: 'Limited-time perks',
  kicker: 'Welcome to Casabella',
  title: 'New offers every week',
  message: 'Check back often for fresh promotions on your favorite nail and spa treatments.',
  ctaLabel: 'View Offers',
  ctaPath: ROUTES.services,
};

const normalizeSlide = (slide, fallback) => ({
  badge: slide?.badge || fallback.badge || defaultOffer.badge,
  kicker: slide?.kicker || fallback.kicker || defaultOffer.kicker,
  title: slide?.title || fallback.title || defaultOffer.title,
  message: slide?.message || fallback.message || defaultOffer.message,
  ctaLabel: slide?.ctaLabel || fallback.ctaLabel || defaultOffer.ctaLabel,
  ctaPath: slide?.ctaPath || fallback.ctaPath || defaultOffer.ctaPath,
  imageUrl: slide?.imageUrl || '',
});

const WelcomeOfferPopup = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [offerContent, setOfferContent] = useState(() =>
    ({ ...defaultOffer, ...(getFromStorage(OFFER_CONTENT_KEY, {}) || {}) })
  );

  const slides = Array.isArray(offerContent?.slides) && offerContent.slides.length > 0
    ? offerContent.slides.map((slide) => normalizeSlide(slide, offerContent))
    : [normalizeSlide(offerContent, offerContent)];
  const slideDurationMsRaw = Number(offerContent?.slideDurationMs);
  const slideDurationMs =
    Number.isFinite(slideDurationMsRaw) && slideDurationMsRaw >= 1000 && slideDurationMsRaw <= 60000
      ? Math.round(slideDurationMsRaw)
      : 5000;
  const activeSlide = slides[Math.min(slideIndex, slides.length - 1)] || defaultOffer;
  const activeImage = activeSlide.imageUrl || offerContent.imageUrl || offerImage;

  useEffect(() => {
    const forcePreview =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('previewOffer') === '1' ||
        new URLSearchParams(window.location.search).get('showOffer') === '1');

    const dismissed = getFromStorage(DISMISS_KEY, false);
    const isHome = location.pathname === ROUTES.home;

    if ((isHome && !dismissed) || forcePreview) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (slideIndex > slides.length - 1) {
      setSlideIndex(0);
    }
  }, [slides.length, slideIndex]);

  useEffect(() => {
    if (!open || slides.length < 2) return undefined;
    const timer = window.setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, slideDurationMs);
    return () => window.clearTimeout(timer);
  }, [open, slides.length, slideDurationMs, slideIndex]);

  useEffect(() => {
    let mounted = true;
    const loadOffer = async () => {
      try {
        const offer = await getWelcomeOffer();
        if (!mounted) return;
        const merged = { ...defaultOffer, ...(offer || {}) };
        setOfferContent(merged);
        saveToStorage(OFFER_CONTENT_KEY, merged);
      } catch (err) {
        // Keep local fallback if API is unavailable.
        console.error('Failed to load popup offer from Firebase:', err);
      }
    };
    loadOffer();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const closePopup = () => {
    if (dontShowAgain) {
      saveToStorage(DISMISS_KEY, true);
    }
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={closePopup}>
      <div className="welcome-offer">
        <div className="welcome-offer-media">
          <img src={activeImage} alt={activeSlide.title || 'Casabella offer'} />
          <div className="welcome-offer-media-overlay" />
        </div>
        <div className="welcome-offer-body">
          <img className="welcome-offer-logo" src={logo} alt="Casabella Nail and Spa logo" />
          <div className="welcome-offer-badge">{activeSlide.badge}</div>
          <p className="eyebrow welcome-offer-kicker">{activeSlide.kicker}</p>
          <h2 className="welcome-offer-title">{activeSlide.title}</h2>
          <p className="section-description welcome-offer-copy">{activeSlide.message}</p>
          {slides.length > 1 ? (
            <div className="welcome-offer-slides">
              <button type="button" className="welcome-slide-btn" onClick={() => setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}>←</button>
              <div className="welcome-slide-dots">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`welcome-slide-dot ${idx === slideIndex ? 'active' : ''}`}
                    onClick={() => setSlideIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button type="button" className="welcome-slide-btn" onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}>→</button>
            </div>
          ) : null}
          <div className="welcome-offer-actions">
            <Button to={activeSlide.ctaPath} onClick={closePopup}>
              {activeSlide.ctaLabel}
            </Button>
            <Button variant="secondary" onClick={closePopup}>
              Maybe later
            </Button>
          </div>
          <label style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center', marginTop: '0.8rem', fontSize: '0.92rem' }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don&apos;t show this popup again
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeOfferPopup;
