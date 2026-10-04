import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ROUTES from '../constants/routes';

const GREETING_TEXT = 'It is a beautiful day to get your nails done.';
const DANCE_MS = 1600;
const GREET_MS = 4200;

const canAnimate = () => (
  typeof window !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const SiteMascot = () => {
  const location = useLocation();
  const [enabled] = useState(canAnimate);
  const [mode, setMode] = useState('idle');
  const lastSectionRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const performForSection = useCallback(() => {
    clearTimers();
    setMode('dancing');
    timersRef.current.push(
      window.setTimeout(() => setMode('greeting'), DANCE_MS),
      window.setTimeout(() => setMode('idle'), DANCE_MS + GREET_MS)
    );
  }, [clearTimers]);

  useEffect(() => {
    if (!enabled) return undefined;

    const targets = Array.from(document.querySelectorAll('main .hero, main section'));
    if (!targets.length) return undefined;

    lastSectionRef.current = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        if (mostVisible.target !== lastSectionRef.current) {
          lastSectionRef.current = mostVisible.target;
          performForSection();
        }
      },
      { threshold: 0.45 }
    );

    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, [clearTimers, enabled, location.pathname, performForSection]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!enabled) return null;

  return (
    <div className={`site-mascot site-mascot--${mode}`}>
      {mode === 'greeting' ? (
        <div className="site-mascot-bubble" role="status">
          <span>{GREETING_TEXT}</span>
          <Link to={ROUTES.bookingExternal} className="site-mascot-bubble-cta">
            Book Now
          </Link>
        </div>
      ) : null}
      <div className="site-mascot-stage" aria-hidden="true">
        <div className="site-mascot-sparkle site-mascot-sparkle-1">✦</div>
        <div className="site-mascot-sparkle site-mascot-sparkle-2">✦</div>
        <div className="site-mascot-shadow" />
        <div className="site-mascot-figure">
          <svg viewBox="0 0 120 150" width="104" height="130" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mascotBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8af2d4" />
                <stop offset="0.45" stopColor="#2bb594" />
                <stop offset="1" stopColor="#176e57" />
              </linearGradient>
              <linearGradient id="mascotCap" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffeec0" />
                <stop offset="0.5" stopColor="#f0c772" />
                <stop offset="1" stopColor="#b87e34" />
              </linearGradient>
              <linearGradient id="mascotTopCap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffe2a8" />
                <stop offset="1" stopColor="#d9a84e" />
              </linearGradient>
            </defs>

            <g className="mascot-arm mascot-arm-left">
              <path d="M28 78 Q4 84 8 104" stroke="#d9a84e" strokeWidth="11" strokeLinecap="round" fill="none" />
              <circle cx="8" cy="106" r="9.5" fill="#d9a84e" stroke="#b8843a" strokeWidth="1.5" />
            </g>

            <g className="mascot-body">
              <ellipse cx="60" cy="138" rx="32" ry="7" fill="rgba(20, 30, 26, 0.22)" />

              <rect x="24" y="58" width="72" height="76" rx="28" fill="url(#mascotBody)" stroke="#15543f" strokeWidth="3" />
              <rect x="40" y="26" width="40" height="36" rx="14" fill="url(#mascotCap)" stroke="#9a6a2c" strokeWidth="3" />
              <rect x="46" y="10" width="28" height="20" rx="9" fill="url(#mascotTopCap)" stroke="#9a6a2c" strokeWidth="3" />
              <rect x="56" y="2" width="8" height="12" rx="3.5" fill="#9a6a2c" />

              <ellipse cx="40" cy="78" rx="9" ry="26" fill="#ffffff" opacity="0.28" />
              <ellipse cx="50" cy="40" rx="6" ry="11" fill="#ffffff" opacity="0.3" />

              <circle cx="46" cy="96" r="6.5" fill="#1c2630" />
              <circle cx="48.4" cy="93.6" r="1.9" fill="#ffffff" />
              <circle cx="74" cy="96" r="6.5" fill="#1c2630" />
              <circle cx="76.4" cy="93.6" r="1.9" fill="#ffffff" />

              <ellipse cx="40" cy="110" rx="6" ry="4.4" fill="#ff9d8a" opacity="0.75" />
              <ellipse cx="80" cy="110" rx="6" ry="4.4" fill="#ff9d8a" opacity="0.75" />

              <path d="M48 114 Q60 126 72 114" stroke="#1c2630" strokeWidth="4" strokeLinecap="round" fill="none" />
            </g>

            <g className="mascot-arm mascot-arm-wave">
              <path d="M92 78 Q116 84 112 104" stroke="#d9a84e" strokeWidth="11" strokeLinecap="round" fill="none" />
              <circle cx="112" cy="106" r="9.5" fill="#d9a84e" stroke="#b8843a" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SiteMascot;
