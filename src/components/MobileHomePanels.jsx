import { useEffect, useRef, useState } from 'react';
import SmartPricingMenu from './SmartPricingMenu';
import MobileGallery from './MobileGallery';

export default function MobileHomePanels({ services, children }) {
  const [view, setView] = useState('home');
  const [visited, setVisited] = useState({});
  const backRef = useRef(null);
  const triggerRef = useRef(null);
  const touchRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      (view === 'home' ? triggerRef.current : backRef.current)?.focus({ preventScroll: true });
    }, view === 'home' || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 340);
    return () => clearTimeout(timer);
  }, [view]);
  const open = (next, trigger) => {
    triggerRef.current = trigger;
    setVisited((prev) => ({ ...prev, [next]: true }));
    setView(next);
  };
  const close = () => {
    setView('home');
  };
  return <>
    <div className={`mobile-home-front ${view !== 'home' ? 'is-away' : ''}`} inert={view !== 'home'} onClick={(event) => {
      const trigger = event.target.closest('button[data-mobile-panel]');
      if (trigger) open(trigger.dataset.mobilePanel, trigger);
    }}>
      {children}
    </div>
    <section className={`mobile-home-panel ${view !== 'home' ? 'is-open' : ''}`} inert={view === 'home'} aria-label={view === 'gallery' ? 'Gallery' : 'Smart Pricing Menu'}
      onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
      onTouchStart={(event) => {
        const interactive = event.target.closest('input, button, a, summary');
        touchRef.current = !interactive && event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
      }}
      onTouchEnd={(event) => {
        const start = touchRef.current;
        touchRef.current = null;
        if (!start || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 2) close();
      }} onTouchCancel={() => { touchRef.current = null; }}>
      <header className="mobile-panel-header">
        <button ref={backRef} type="button" onClick={close} aria-label="Back to home">← Back</button>
        <strong>{view === 'gallery' ? 'Gallery' : 'Smart Pricing'}</strong>
        <span>Casabella</span>
      </header>
      <div className="mobile-panel-scroll">
        <div hidden={view !== 'pricing'}>{visited.pricing ? <SmartPricingMenu services={services} /> : null}</div>
        <div hidden={view !== 'gallery'}>{visited.gallery ? <MobileGallery /> : null}</div>
      </div>
    </section>
  </>;
}
