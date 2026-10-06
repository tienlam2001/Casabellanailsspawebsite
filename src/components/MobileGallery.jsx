import { useEffect, useState } from 'react';
import { getGalleryImages } from '../utils/adminApi';
import { getDefaultGallery } from '../utils/defaultGallery';

export default function MobileGallery() {
  const [images, setImages] = useState(getDefaultGallery);
  const [filter, setFilter] = useState('All');
  useEffect(() => {
    let mounted = true;
    getGalleryImages().then((items) => {
      if (mounted && items?.length) setImages(items.map((item) => ({ ...item, src: item.imageUrl || item.src })));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const categories = ['All', ...new Set(images.map((image) => image.category).filter(Boolean))];
  const visible = filter === 'All' ? images : images.filter((image) => image.category === filter);
  return <div className="mobile-gallery">
    <p>Find your next look. Tap a photo to see the full image.</p>
    <div className="mobile-gallery-filters" aria-label="Photo categories">
      {categories.map((category) => <button type="button" key={category} aria-pressed={category === filter} onClick={() => setFilter(category)}>{category}</button>)}
    </div>
    <p role="status">{visible.length} photos</p>
    <div className="mobile-gallery-grid">
      {visible.map((image, index) => <details key={image.id || image.src} className="mobile-gallery-photo">
        <summary aria-label={`View ${image.category || 'gallery'} photo ${index + 1}`}>
          <img src={image.src} alt={image.alt || `${image.category || 'Salon'} inspiration`} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
          <span>{image.category || 'Salon'} · Tap to expand</span>
        </summary>
        <p className="mobile-gallery-caption">Tap photo to collapse</p>
      </details>)}
    </div>
  </div>;
}
