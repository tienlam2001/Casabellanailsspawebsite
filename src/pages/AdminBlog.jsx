import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Button from '../components/Button';
import ROUTES from '../constants/routes';
import { getFromStorage, saveToStorage } from '../utils/storage';
import { setDocumentTitle, setMetaDescription, setRobotsMeta } from '../utils/seo';
import fallbackPosts from '../data/posts.json';
import slugify from '../utils/slug';
import {
  getAdminToken,
  setAdminToken,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  seedBlogPostsCollection,
} from '../utils/adminApi';

const ADMIN_SESSION_KEY = 'adminSession';
const emptyForm = {
  title: '',
  slug: '',
  date: '',
  excerpt: '',
  content: '',
  tags: '',
};

const AdminBlog = () => {
  const navigate = useNavigate();
  const session = getFromStorage(ADMIN_SESSION_KEY, null);
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDocumentTitle('Admin Blog');
    setMetaDescription('Admin panel for creating and editing blog posts.');
    setRobotsMeta('noindex, nofollow');
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const remote = await getBlogPosts();
        setPosts(Array.isArray(remote) ? remote : []);
      } catch (err) {
        setError(err.message || 'Unable to load posts.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!session?.loggedIn) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: ROUTES.adminBlog }} />;
  }

  const withAuthHandling = async (action) => {
    const token = getAdminToken();
    if (!token) {
      navigate(ROUTES.adminLogin, { replace: true });
      return null;
    }
    try {
      return await action();
    } catch (err) {
      if (err?.status === 401 || err?.code === 'unauthenticated') {
        setAdminToken(null);
        saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
        navigate(ROUTES.adminLogin, { replace: true });
        return null;
      }
      throw err;
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onLogout = () => {
    setAdminToken(null);
    saveToStorage(ADMIN_SESSION_KEY, { loggedIn: false });
    navigate(ROUTES.adminLogin, { replace: true });
  };

  const normalizedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()),
    [posts]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice('');
    setError('');

    const title = String(form.title || '').trim();
    const slug = String(form.slug || '').trim() || slugify(title);
    const date = String(form.date || '').trim();
    const excerpt = String(form.excerpt || '').trim();
    const content = String(form.content || '').trim();
    const tags = String(form.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title || !slug || !date || !excerpt || !content) {
      setError('Title, slug, date, excerpt, and content are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = { title, slug, date, excerpt, content, tags };
      const next = await withAuthHandling(() =>
        editingId ? updateBlogPost(editingId, payload) : createBlogPost(payload)
      );
      if (!next) return;
      setPosts(next);
      setNotice(editingId ? 'Post updated.' : 'Post created.');
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save post.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      date: post.date || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      tags: (post.tags || []).join(', '),
    });
    setNotice('');
    setError('');
  };

  const onDelete = async (id) => {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const next = await withAuthHandling(() => deleteBlogPost(id));
      if (!next) return;
      setPosts(next);
      if (editingId === id) resetForm();
      setNotice('Post deleted.');
    } catch (err) {
      setError(err.message || 'Unable to delete post.');
    } finally {
      setSaving(false);
    }
  };

  const seedFromDefaults = async (overwrite = false) => {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const next = await withAuthHandling(() =>
        seedBlogPostsCollection(fallbackPosts, { overwrite })
      );
      if (!next) return;
      setPosts(next);
      setNotice(overwrite ? 'Blog reset from local defaults.' : 'Firebase blog initialized from local defaults.');
    } catch (err) {
      setError(err.message || 'Unable to initialize blog posts.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      eyebrow="Admin"
      title="Blog Manager"
      description="Create, edit, and delete blog posts stored in Firebase."
    >
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={onSubmit} noValidate>
            <FormField label="Title" required>
              <FormField.Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </FormField>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <FormField label="Slug" required helper="Leave blank to auto-generate from title">
                <FormField.Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="spring-nail-colors-oviedo" />
              </FormField>
              <FormField label="Date" required>
                <FormField.Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Excerpt" required>
              <FormField.TextArea rows={3} value={form.excerpt} onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))} />
            </FormField>
            <FormField label="Content" required helper="Use '-' for bullet points on new lines.">
              <FormField.TextArea rows={8} value={form.content} onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} />
            </FormField>
            <FormField label="Tags" helper="Comma-separated">
              <FormField.Input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="Nail Care, How-To" />
            </FormField>

            {notice ? <p className="muted" style={{ margin: 0 }}>{notice}</p> : null}
            {error ? <p className="field-error" style={{ margin: 0 }}>{error}</p> : null}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Post' : 'Create Post'}</Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Clear Form</Button>
              </div>
              <Button type="button" variant="ghost" onClick={onLogout}>Logout</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Admin Navigation</p>
          <h3 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>Other admin tools</h3>
          <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button to={ROUTES.adminAdvertise} variant="secondary">Go to Advertise</Button>
            <Button to={ROUTES.adminServices} variant="secondary">Go to Services Pricing</Button>
            <Button to={ROUTES.adminGallery} variant="secondary">Go to Gallery Manager</Button>
            <Button to={ROUTES.blog} variant="ghost">Open Public Blog</Button>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={() => seedFromDefaults(false)} disabled={saving}>Initialize Firebase Blog</Button>
            <Button type="button" variant="ghost" onClick={() => seedFromDefaults(true)} disabled={saving}>Reset from Local Defaults</Button>
          </div>
          <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
            Blog posts are stored in Firestore collection <code>blogPosts</code>.
          </p>
        </Card>
      </div>

      <Card style={{ marginTop: '1.25rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>Current posts</p>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>Loading posts...</p>
        ) : normalizedPosts.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No posts yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {normalizedPosts.map((post) => (
              <div key={post.id} className="card" style={{ padding: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.9rem', alignItems: 'center' }}>
                  <div>
                    <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>{post.date}</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{post.title}</p>
                    <p className="muted" style={{ margin: '0.35rem 0 0' }}>/{post.slug}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button type="button" variant="secondary" onClick={() => onEdit(post)} disabled={saving}>Edit</Button>
                    <Button type="button" variant="ghost" onClick={() => onDelete(post.id)} disabled={saving}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="muted" style={{ marginTop: '0.9rem' }}>
        <Link to={ROUTES.blog}>View how this appears on the public Blog page.</Link>
      </p>
    </Section>
  );
};

export default AdminBlog;
