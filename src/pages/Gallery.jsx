import { useEffect, useMemo, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ROUTES from '../constants/routes';
import { setLocalBusinessJsonLd, setPageSeo } from '../utils/seo';
import { getGalleryImages } from '../utils/adminApi';

import { getDefaultGallery } from '../utils/defaultGallery';

const Gallery = () => {
  useEffect(() => {
    setPageSeo({
      title: 'Nail Gallery in Oviedo, FL Near Orlando',
      description:
        'View Casabella Nail & Spa photos featuring Oviedo and Orlando-area manicures, nail art, acrylic nails, dip powder, Gel-X, spa pedicures, and salon details.',
      path: ROUTES.gallery,
    });
    setLocalBusinessJsonLd();
  }, []);

  const [filter, setFilter] = useState('All');
  const [activeImage, setActiveImage] = useState(null);
  const [remoteImages, setRemoteImages] = useState([]);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const list = await getGalleryImages();
        if (Array.isArray(list)) {
          setRemoteImages(
            list.map((item) => ({
              ...item,
              src: item.imageUrl || item.src,
            }))
          );
        }
      } catch {
        setRemoteImages([]);
      }
    };

    loadGallery();
  }, []);

  const allImages = useMemo(() => {
    if (remoteImages.length > 0) return remoteImages;
    return getDefaultGallery();
  }, [remoteImages]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(allImages.map((item) => item.category).filter(Boolean)))],
    [allImages]
  );

  const filtered = filter === 'All'
    ? allImages
    : allImages.filter((item) => item.category === filter);

  const RATIOS = ['4 / 5', '1 / 1', '3 / 4', '4 / 3'];

  const getRatio = (idx) => {
    const seed = (idx * 1103515245 + 12345) >>> 0;
    return RATIOS[seed % RATIOS.length];
  };

  return (
    <div>
      <Section
        eyebrow="Gallery"
        title="Nail gallery from our Oviedo, FL salon"
        description="Browse recent manicures, acrylic nails, dip powder, Gel-X, spa pedicures, and before/after transformations from guests across Oviedo, Florida."
      >
        {/* Top controls */}
        <div className="gallery-controls">
          <div
            style={{
              border: '1px solid rgba(216,182,103,0.14)',
              borderRadius: '22px',
              padding: '1.25rem 1.25rem',
              background: 'linear-gradient(180deg, rgba(216,182,103,0.06) 0%, rgba(255,255,255,1) 70%)',
              boxShadow: '0 22px 55px rgba(0,0,0,0.06)',
            }}
          >
            <p className="eyebrow" style={{ margin: 0 }}>Browse by vibe</p>
            <h2 className="section-title" style={{ margin: '0.35rem 0 0.35rem', fontSize: '2rem' }}>
              Nails, spa moments, and transformations.
            </h2>
            <p className="muted" style={{ margin: 0, maxWidth: '48ch' }}>
              Tap a category to filter. Click any photo to view it full-size and share your inspo with your technician.
            </p>

            <div
              style={{
                marginTop: '1.05rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.65rem',
                alignItems: 'center',
              }}
            >
              {categories.map((category) => {
                const active = filter === category;
                return (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    type="button"
                    style={{
                      border: '1px solid',
                      borderColor: active ? 'rgba(216,182,103,0.55)' : 'rgba(216,182,103,0.22)',
                      background: active ? 'rgba(216,182,103,0.10)' : '#fff',
                      color: 'var(--charcoal)',
                      padding: '0.55rem 0.9rem',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      boxShadow: active ? '0 16px 35px rgba(0,0,0,0.07)' : '0 8px 22px rgba(0,0,0,0.04)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 700,
                    }}
                    aria-pressed={active}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: active ? 'var(--pine)' : 'rgba(216,182,103,0.25)',
                        boxShadow: active ? '0 0 0 4px rgba(216,182,103,0.12)' : 'none',
                      }}
                    />
                    {category}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: '1.05rem',
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span
                className="pill"
                style={{
                  background: 'rgba(216,182,103,0.08)',
                  color: 'var(--charcoal)',
                  boxShadow: 'none',
                }}
              >
                {filter === 'All' ? 'Showing everything' : `Showing: ${filter}`}
              </span>
              <span className="muted" style={{ fontWeight: 700 }}>
                {filtered.length} photos
              </span>
            </div>
          </div>

          {/* Quick summary cards */}
          <div className="gallery-summary" style={{ display: 'grid', gap: '0.85rem' }}>
            <div
              style={{
                border: '1px solid rgba(216,182,103,0.14)',
                borderRadius: '22px',
                padding: '1rem 1rem',
                background: '#fff',
                boxShadow: '0 18px 45px rgba(0,0,0,0.05)',
              }}
            >
              <p className="eyebrow" style={{ margin: 0 }}>Popular</p>
              <p style={{ margin: '0.35rem 0 0', fontWeight: 800, fontSize: '1.1rem' }}>Gel • Dip • Spa Pedicure</p>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>Bring a screenshot — we’ll match the finish and shape.</p>
            </div>

            <div
              style={{
                border: '1px solid rgba(216,182,103,0.14)',
                borderRadius: '22px',
                padding: '1rem 1rem',
                background: 'linear-gradient(180deg, rgba(216,182,103,0.10) 0%, #ffffff 85%)',
                boxShadow: '0 18px 45px rgba(0,0,0,0.05)',
              }}
            >
              <p className="eyebrow" style={{ margin: 0 }}>Studio vibe</p>
              <p style={{ margin: '0.35rem 0 0', fontWeight: 800, fontSize: '1.1rem' }}>Clean, calm, polished</p>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>Oviedo, Florida — easy booking, friendly service.</p>
            </div>

            <div
              style={{
                border: '1px solid rgba(216,182,103,0.14)',
                borderRadius: '22px',
                padding: '1rem 1rem',
                background: '#fff',
                boxShadow: '0 18px 45px rgba(0,0,0,0.05)',
              }}
            >
              <p className="eyebrow" style={{ margin: 0 }}>Tip</p>
              <p style={{ margin: '0.35rem 0 0', fontWeight: 800, fontSize: '1.1rem' }}>Ask for “Casabella finish”</p>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>We’ll tailor the shine level and details to your skin tone.</p>
            </div>
          </div>
        </div>

        {/* Gallery grid */}
        <div
          className="gallery-grid gallery-masonry"
          style={{
            marginTop: '1.35rem',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {filtered.map((image, idx) => {
            return (
              <button
                key={`${image.category}-${image.src}-${idx}`}
                type="button"
                onClick={() => setActiveImage(image)}
                style={{
                  width: '100%',
                  display: 'inline-block',
                  marginBottom: '14px',
                  border: '1px solid rgba(216,182,103,0.14)',
                  borderRadius: '18px',
                  padding: '0',
                  background: '#fff',
                  boxShadow: '0 18px 45px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  overflow: 'hidden',
                  breakInside: 'avoid',
                }}
                aria-label={`Open ${image.category} image`}
              >
                <div
                  style={{
                    borderRadius: '0',
                    overflow: 'hidden',
                    aspectRatio: getRatio(idx),
                    background: 'rgba(216,182,103,0.06)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.01)' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="pill"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        color: 'var(--charcoal)',
                        boxShadow: 'none',
                        padding: '0.35rem 0.75rem',
                      }}
                    >
                      {image.category}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <Card
          className="cta-strip"
          style={{
            marginTop: '2.5rem',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          <div>
            <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '0.35rem' }}>
              Ready when you are
            </p>
            <h3 className="section-title" style={{ color: '#fff', margin: 0, fontSize: '1.8rem' }}>
              Bring your inspo — we’ll match it and elevate it.
            </h3>
            <p style={{ marginTop: '0.6rem', color: 'rgba(255,255,255,0.85)', maxWidth: '60ch' }}>
              Book online in minutes. Want something specific? Send us a reference photo and we’ll confirm the best service.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.bookingExternal} variant="secondary">
              Book Now
            </Button>
            <Button to={ROUTES.contactExternal} variant="ghost" className="btn-ghost" style={{ color: '#fff' }}>
              Contact
            </Button>
          </div>
        </Card>
      </Section>

      <Modal open={Boolean(activeImage)} onClose={() => setActiveImage(null)}>
        {activeImage ? (
          <div className="modal-body">
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              style={{ width: '100%', height: '100%', maxHeight: '70vh', objectFit: 'cover', borderRadius: '0' }}
            />
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p className="eyebrow" style={{ marginBottom: 0 }}>
                {activeImage.category}
              </p>
              <h3 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>
                Casabella Nail & Spa
              </h3>
              <p className="muted">{activeImage.alt}</p>
              <p className="muted">
                Clean prep, premium finishes, and a calm atmosphere in Oviedo, Florida.
              </p>
              <Button to={ROUTES.bookingExternal}>Request This Look</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Gallery;
