import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';
import { getFromStorage, saveToStorage } from '../utils/storage';
import ROUTES from '../constants/routes';
import logo from '../assets/casalogo.png';
import offerImage from '../assets/nails/783990E5-9AE8-4718-A1C7-E200A4B6DE1A_4_5005_c.jpeg';
import { getWelcomeOffer } from '../utils/adminApi';

const DISMISS_KEY = 'welcomeOfferDismissed:september-2026';
const OFFER_CONTENT_KEY = 'welcomeOfferContent';

const defaultOffer = {
  badge: 'September special',
  kicker: 'Monday + Tuesday',
  title: '10% Off When You Spend Over $60',
  message: 'Enjoy 10% off Monday and Tuesday during September when your visit is over $60. Promotion updates will be sent by phone or posted later, so stay tuned.',
  ctaLabel: 'Sign Up for Reminders',
  ctaPath: ROUTES.promotionReminders,
  imageUrl: '/promotions/september-special-mon-tue.svg',
  slideDurationMs: 6500,
  slides: [
    {
      badge: 'September special',
      kicker: 'Monday + Tuesday',
      title: '10% Off When You Spend Over $60',
      message: 'Enjoy 10% off Monday and Tuesday during September when your visit is over $60. Promotion updates will be sent by phone or posted later, so stay tuned.',
      ctaLabel: 'Sign Up for Reminders',
      ctaPath: ROUTES.promotionReminders,
      imageUrl: '/promotions/september-special-mon-tue.svg',
    },
  ],
};

const legacyOfferTerms = ['august', 'happy hour', 'thursday', 'friday', 'over $80', 'august-happy-hour'];

const hasLegacyOfferContent = (offer) => {
  const searchable = JSON.stringify(offer || {}).toLowerCase();
  return legacyOfferTerms.some((term) => searchable.includes(term));
};

const getCurrentOfferContent = (offer) => {
  if (!offer || hasLegacyOfferContent(offer)) return defaultOffer;
  return { ...defaultOffer, ...offer };
};

const safePath = (value, fallback) => {
  const s = String(value || '').trim();
  return s.startsWith('/') ? s : fallback;
};

const normalizeSlide = (slide, fallback) => ({
  badge: slide?.badge || fallback.badge || defaultOffer.badge,
  kicker: slide?.kicker || fallback.kicker || defaultOffer.kicker,
  title: slide?.title || fallback.title || defaultOffer.title,
  message: slide?.message || fallback.message || defaultOffer.message,
  ctaLabel: slide?.ctaLabel || fallback.ctaLabel || defaultOffer.ctaLabel,
  ctaPath: safePath(slide?.ctaPath || fallback.ctaPath, defaultOffer.ctaPath),
  imageUrl: slide?.imageUrl || '',
});

const WelcomeOfferPopup = () => {
  const location = useLocation();
  const [dismissedForSession, setDismissedForSession] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [offerContent, setOfferContent] = useState(() => getCurrentOfferContent(getFromStorage(OFFER_CONTENT_KEY, null)));

  const slides = Array.isArray(offerContent?.slides) && offerContent.slides.length > 0
    ? offerContent.slides.map((slide) => normalizeSlide(slide, offerContent))
    : [normalizeSlide(offerContent, offerContent)];
  const slideDurationMsRaw = Number(offerContent?.slideDurationMs);
  const slideDurationMs =
    Number.isFinite(slideDurationMsRaw) && slideDurationMsRaw >= 1000 && slideDurationMsRaw <= 60000
      ? Math.round(slideDurationMsRaw)
      : 5000;
  const activeSlideIndex = Math.min(slideIndex, slides.length - 1);
  const activeSlide = slides[activeSlideIndex] || defaultOffer;
  const activeImage = activeSlide.imageUrl || offerContent.imageUrl || offerImage;
  const forcePreview =
    typeof window !== 'undefined' &&
    (new URLSearchParams(location.search).get('previewOffer') === '1' ||
      new URLSearchParams(location.search).get('showOffer') === '1');
  const dismissed = getFromStorage(DISMISS_KEY, false);
  const open = !dismissedForSession && ((location.pathname === ROUTES.home && !dismissed) || forcePreview);

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
        const merged = getCurrentOfferContent(offer);
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
    setDismissedForSession(true);
  };

  return (
    <Modal open={open} onClose={closePopup} className="welcome-offer-modal">
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
              <button
                type="button"
                className="welcome-slide-btn"
                onClick={() => setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                aria-label="Previous offer"
              >
                ←
              </button>
              <div className="welcome-slide-dots">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`welcome-slide-dot ${idx === activeSlideIndex ? 'active' : ''}`}
                    onClick={() => setSlideIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="welcome-slide-btn"
                onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
                aria-label="Next offer"
              >
                →
              </button>
            </div>
          ) : null}
          <div className="welcome-offer-actions">
            <Button to={activeSlide.ctaPath || ROUTES.promotions} onClick={closePopup}>
              {activeSlide.ctaLabel || 'View More Details'}
            </Button>
            <Button variant="secondary" onClick={closePopup}>
              Maybe later
            </Button>
          </div>
          <label className="welcome-offer-dismiss">
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
