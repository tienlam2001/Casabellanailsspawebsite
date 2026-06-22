import { useEffect } from 'react';
import Card from './Card';

const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/casabellaoviedoo/';

const InstagramFeed = ({ posts }) => {
  const hasEmbeds = posts.some((post) => post.postUrl);

  useEffect(() => {
    if (!hasEmbeds || typeof window === 'undefined') return;

    const existing = document.querySelector('script[src="//www.instagram.com/embed.js"]');
    if (existing && window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
      return;
    }

    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.src = '//www.instagram.com/embed.js';
      script.onload = () => window.instgrm?.Embeds?.process?.();
      document.body.appendChild(script);
    }
  }, [hasEmbeds, posts]);

  return (
    <div className="instagram-feed">
      {posts.slice(0, 7).map((post, index) => {
        if (post.postUrl) {
          return (
            <Card key={post.id || post.postUrl} className="instagram-embed-card">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={post.postUrl}
                data-instgrm-version="14"
                style={{
                  background: '#fff',
                  border: 0,
                  margin: 0,
                  maxWidth: '100%',
                  minWidth: 0,
                  width: '100%',
                }}
              />
            </Card>
          );
        }

        return (
          <a
            key={post.id}
            className="instagram-preview-card"
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open Instagram post preview ${index + 1}`}
          >
            <img src={post.image} alt={post.title} />
            <span className="instagram-preview-overlay">
              <span className="instagram-preview-label">@casabellaoviedoo</span>
              <span className="instagram-preview-title">{post.title}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
};

export { INSTAGRAM_PROFILE_URL };
export default InstagramFeed;
