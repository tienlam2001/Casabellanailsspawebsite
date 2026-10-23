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
const MOBILE_HOME_QUERY = '(max-width: 900px), (max-width: 1366px) and (pointer: coarse)';

const normalizeSlide = (slide) => ({
  badge: String(slide?.badge || '').trim(),
  kicker: String(slide?.kicker || '').trim(),
  title: String(slide?.title || '').trim(),
  message: String(slide?.message || '').trim(),
  ctaLabel: String(slide?.ctaLabel || 'View More Details').trim(),
  ctaPath: String(slide?.ctaPath || ROUTES.promotions),
  imageUrl: String(slide?.imageUrl || '').trim(),
});

const WelcomeOfferPopup = () => {
  const location = useLocation();
  const [dismissedForSession, setDismissedForSession] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [offerContent, setOfferContent] = useState(null);
  const [isMobileHome, setIsMobileHome] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_HOME_QUERY).matches
  );

  const slides = Array.isArray(offerContent?.slides)
    ? offerContent.slides.map((slide) => normalizeSlide(slide)).filter((slide) => slide.title)
    : [];
  const slideDurationMsRaw = Number(offerContent?.slideDurationMs);
  const slideDurationMs =
    Number.isFinite(slideDurationMsRaw) && slideDurationMsRaw >= 1000 && slideDurationMsRaw <= 60000
      ? Math.round(slideDurationMsRaw)
      : 6500;
  const activeSlideIndex = slides.length ? Math.min(slideIndex, slides.length - 1) : 0;
  const activeSlide = slides[activeSlideIndex] || null;
  const activeImage = activeSlide?.imageUrl || offerImage;
  const forcePreview =
    typeof window !== 'undefined' &&
    (new URLSearchParams(location.search).get('previewOffer') === '1' ||
      new URLSearchParams(location.search).get('showOffer') === '1');
  const dismissed = getFromStorage(DISMISS_KEY, false);
  const open = Boolean(activeSlide) && !dismissedForSession && (
    (location.pathname === ROUTES.home && (isMobileHome || !dismissed)) || forcePreview
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_HOME_QUERY);
    const updateMobileState = () => setIsMobileHome(media.matches);
    updateMobileState();
    media.addEventListener('change', updateMobileState);
    return () => media.removeEventListener('change', updateMobileState);
  }, []);

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
        setOfferContent(offer?.slides?.length ? offer : null);
      } catch (err) {
        if (!mounted) return;
        setOfferContent(null);
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
          <img src={activeImage} alt={activeSlide?.title || 'Casabella offer'} />
        </div>
        <div className="welcome-offer-body">
          <img className="welcome-offer-logo" src={logo} alt="Casabella Nail and Spa logo" />
          {activeSlide?.badge ? <div className="welcome-offer-badge">{activeSlide.badge}</div> : null}
          {activeSlide?.kicker ? <p className="eyebrow welcome-offer-kicker">{activeSlide.kicker}</p> : null}
          <h2 className="welcome-offer-title">{activeSlide?.title}</h2>
          {activeSlide?.message ? <p className="section-description welcome-offer-copy">{activeSlide.message}</p> : null}
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
            <Button to={activeSlide?.ctaPath || ROUTES.promotions} onClick={closePopup}>
              {activeSlide?.ctaLabel || 'View More Details'}
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
