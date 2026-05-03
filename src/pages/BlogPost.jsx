import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import posts from '../data/posts.json';
import { setDocumentTitle, setMetaDescription } from '../utils/seo';

const renderContent = (content) => {
  const lines = content.split('\n');
  const blocks = [];
  let list = [];

  lines.forEach((line) => {
    if (line.startsWith('- ')) {
      list.push(line.replace('- ', ''));
    } else {
      if (list.length) {
        blocks.push({ type: 'list', items: list });
        list = [];
      }
      if (line.trim()) blocks.push({ type: 'paragraph', text: line });
    }
  });

  if (list.length) blocks.push({ type: 'list', items: list });
  return blocks;
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = useMemo(() => posts.find((item) => item.slug === slug), [slug]);

  useEffect(() => {
    if (post) {
      setDocumentTitle(post.title);
      setMetaDescription(post.excerpt);
    } else {
      setDocumentTitle('Post not found');
    }
  }, [post]);

  if (!post) {
    return (
      <div>
        <Section title="Post not found">
          <Card>
            <p className="muted">
              We could not locate that article. Browse the Casabella blog for the latest nail care and spa notes.
            </p>
            <Button to={ROUTES.blog} style={{ marginTop: '0.5rem' }}>Back to blog</Button>
          </Card>
        </Section>
      </div>
    );
  }

  const blocks = renderContent(post.content);

  return (
    <div>
      <Section
        eyebrow="Journal"
        title={post.title}
        description="Calm, premium guidance from Casabella Nail & Spa in Oviedo, Florida."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'rgba(31,41,51,0.7)' }}>
          <span className="pill" style={{ background: 'rgba(216,182,103,0.12)' }}>
            {new Date(post.date).toLocaleDateString()}
          </span>
          {post.tags?.map((tag) => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {blocks.map((block, index) => {
              if (block.type === 'list') {
                return (
                  <ul key={index} style={{ paddingLeft: '1.2rem', lineHeight: 1.6, color: 'rgba(31,41,51,0.8)', margin: 0 }}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} style={{ margin: 0, color: 'rgba(31,41,51,0.8)', lineHeight: 1.65 }}>
                  {block.text}
                </p>
              );
            })}
          </div>
        </Card>

        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="muted">
            <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
              Visit us
            </p>
            <p style={{ margin: 0 }}>
              Casabella Nail & Spa · Oviedo, Florida <br />
              Clean, luxurious manicures and spa pedicures.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button to={ROUTES.bookingExternal}>Book Now</Button>
            <Button to={ROUTES.services} variant="secondary">
              Services
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', color: 'rgba(31,41,51,0.7)', fontSize: '0.95rem' }}>
          <Link to={ROUTES.blog} style={{ color: 'inherit' }}>
            ← Back to blog
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default BlogPost;
