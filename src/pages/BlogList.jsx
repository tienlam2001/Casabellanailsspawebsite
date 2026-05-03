import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import postsData from '../data/posts.json';
import { setDocumentTitle, setMetaDescription } from '../utils/seo';

const BlogList = () => {
  useEffect(() => {
    setDocumentTitle('Blog');
    setMetaDescription('Read the Casabella Nail & Spa journal for nail care tips, spa rituals, and Oviedo, Florida spotlights.');
  }, []);

  const posts = useMemo(
    () =>
      [...postsData].sort(
        (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
      ),
    []
  );

  return (
    <div>
      <Section
        eyebrow="Journal"
        title="Thoughtful nail care and spa guidance"
        description="Tips from Oviedo&apos;s calmest nail studio—designed to keep your manicure immaculate and your spa days restorative."
      >
        <div className="grid-2" style={{ alignItems: 'start', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map((post) => (
              <Card key={post.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <p className="eyebrow" style={{ color: 'rgba(31,41,51,0.55)' }}>
                  {new Date(post.date).toLocaleDateString()}
                </p>
                <Link to={`${ROUTES.blog}/${post.slug}`} style={{ color: 'inherit' }}>
                  <h3 className="section-title" style={{ fontSize: '1.4rem', margin: 0 }}>
                    {post.title}
                  </h3>
                </Link>
                <p className="section-description" style={{ marginTop: '0.25rem' }}>
                  {post.excerpt}
                </p>
                <div className="blog-tags">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button to={`${ROUTES.blog}/${post.slug}`} variant="ghost">
                    Read Post →
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
                Visit us
              </p>
              <p className="muted" style={{ marginTop: 0 }}>
                Casabella Nail & Spa <br />
                Oviedo, Florida <br />
                <a href="tel:+13214446297">(321) 444-6297</a>
              </p>
              <p className="muted">
                Cleanliness-first manicures, spa pedicures, and restorative treatments.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Button to={ROUTES.bookingExternal}>Book Now</Button>
                <Button to={ROUTES.services} variant="secondary">
                  Services
                </Button>
              </div>
            </Card>
            <Card>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
                Popular topics
              </p>
              <div className="blog-tags" style={{ marginTop: '0.35rem' }}>
                <span className="pill">Nail Care</span>
                <span className="pill">Spa Rituals</span>
                <span className="pill">Oviedo</span>
                <span className="pill">Hygiene</span>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default BlogList;
