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

const WelcomeOfferPopup = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [offerContent, setOfferContent] = useState(() =>
    ({ ...defaultOffer, ...(getFromStorage(OFFER_CONTENT_KEY, {}) || {}) })
  );

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
    let mounted = true;
    const loadOffer = async () => {
      try {
        const offer = await getWelcomeOffer();
        if (!mounted) return;
        const merged = { ...defaultOffer, ...(offer || {}) };
        setOfferContent(merged);
        saveToStorage(OFFER_CONTENT_KEY, merged);
      } catch {
        // Keep local fallback if API is unavailable.
      }
    };
    loadOffer();
    return () => {
      mounted = false;
    };
  }, []);

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
          <img src={offerImage} alt="Elegant manicure offer preview" />
          <div className="welcome-offer-media-overlay" />
        </div>
        <div className="welcome-offer-body">
          <img className="welcome-offer-logo" src={logo} alt="Casabella Nail and Spa logo" />
          <div className="welcome-offer-badge">{offerContent.badge}</div>
          <p className="eyebrow welcome-offer-kicker">{offerContent.kicker}</p>
          <h2 className="welcome-offer-title">{offerContent.title}</h2>
          <p className="section-description welcome-offer-copy">{offerContent.message}</p>
          <div className="welcome-offer-actions">
            <Button to={offerContent.ctaPath} onClick={closePopup}>
              {offerContent.ctaLabel}
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
