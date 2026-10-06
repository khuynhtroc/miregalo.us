'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Post, Category, Author, Product, GiftItem, FaqItem, MediaFile } from '@/lib/types';
import { slugify, postPath } from '@/lib/urls';

interface PostEditorProps {
  initialPost?: Partial<Post>;
  categories: Category[];
  authors: Author[];
  products: Product[];
  mediaFiles?: MediaFile[];
  isNew?: boolean;
}

export function PostEditor({
  initialPost,
  categories,
  authors,
  products,
  mediaFiles: initialMediaFiles = [],
  isNew = false,
}: PostEditorProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'content' | 'items' | 'faqs' | 'seo'>('content');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Media Library state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMediaFiles);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'hero' | { itemIndex: number } | null>(null);
  const [mediaSearch, setMediaSearch] = useState('');

  // Form state
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [type, setType] = useState<Post['type']>(initialPost?.type || 'gift');
  const [status, setStatus] = useState<Post['status']>(initialPost?.status || 'draft');
  const [primaryCatId, setPrimaryCatId] = useState(initialPost?.primary_category_id || '');
  const [categoryIds, setCategoryIds] = useState<string[]>(initialPost?.category_ids || []);
  const [authorId, setAuthorId] = useState(initialPost?.author_id || authors[0]?.id || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [heroImage, setHeroImage] = useState(initialPost?.hero_image || '');
  const [heroAlt, setHeroAlt] = useState(initialPost?.hero_alt || '');
  const [featured, setFeatured] = useState(!!initialPost?.featured);
  const [editorPick, setEditorPick] = useState(!!initialPost?.editor_pick);

  // Content state
  const [introHtml, setIntroHtml] = useState(initialPost?.intro_html || '');
  const [contentHtml, setContentHtml] = useState(initialPost?.content_html || '');

  // Items state (for gift guides)
  const [items, setItems] = useState<GiftItem[]>(initialPost?.items || []);

  // FAQs state
  const [faqs, setFaqs] = useState<FaqItem[]>(initialPost?.faqs || []);

  // SEO state
  const [focusKeyword, setFocusKeyword] = useState(initialPost?.focus_keyword || '');
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialPost?.seo_description || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialPost?.canonical_url || '');
  const [robots, setRobots] = useState(initialPost?.robots || 'index, follow');

  // Load media files if not provided initially
  useEffect(() => {
    if (mediaFiles.length === 0) {
      fetch('/api/admin/media/')
        .then((r) => r.json())
        .then((d) => {
          if (d.files) setMediaFiles(d.files);
        })
        .catch(() => {});
    }
  }, [mediaFiles.length]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew || !slug) {
      setSlug(slugify(val));
    }
  };

  const handleCategoryToggle = (id: string) => {
    if (categoryIds.includes(id)) {
      setCategoryIds(categoryIds.filter((cid) => cid !== id));
    } else {
      setCategoryIds([...categoryIds, id]);
    }
  };

  // AI Section Optimization Handler
  const handleAiOptimize = async (action: string) => {
    setAiLoading(action);
    setError('');
    setSuccess('');

    try {
      const selectedCategory = categories.find((c) => c.id === primaryCatId)?.slug || 'regalos';
      const res = await fetch('/api/admin/ai/optimize-section/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          title,
          topic: focusKeyword || title,
          currentContent: introHtml,
          focusKeyword,
          category: selectedCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'AI optimization failed.');
        setAiLoading(null);
        return;
      }

      if (action === 'optimize_title' && data.selected) {
        setTitle(data.selected);
        if (data.slug) setSlug(data.slug);
        setSuccess('Title and URL slug optimized with high-CTR Spanish hook!');
      } else if (action === 'optimize_intro') {
        if (data.introHtml) setIntroHtml(data.introHtml);
        if (data.excerpt) setExcerpt(data.excerpt);
        setSuccess('Introduction & Excerpt enhanced in engaging Spanish!');
      } else if (action === 'optimize_content') {
        if (data.contentHtml) setContentHtml(data.contentHtml);
        setSuccess('Article buying guide & conclusion enriched with buying advice!');
      } else if (action === 'generate_items' && data.items) {
        setItems([...items, ...data.items]);
        setActiveTab('items');
        setSuccess(`Added ${data.items.length} AI-suggested product recommendations!`);
      } else if (action === 'generate_faqs' && data.faqs) {
        setFaqs([...faqs, ...data.faqs]);
        setActiveTab('faqs');
        setSuccess(`Added ${data.faqs.length} Spanish FAQ accordion items with schema support!`);
      } else if (action === 'seo_meta') {
        if (data.seoTitle) setSeoTitle(data.seoTitle);
        if (data.seoDescription) setSeoDescription(data.seoDescription);
        if (data.focusKeyword) setFocusKeyword(data.focusKeyword);
        setActiveTab('seo');
        setSuccess('SEO Meta tags and focus keyword optimized for Google search!');
      } else if (action === 'optimize_all') {
        // Run all sequential optimizations
        const [introRes, contentRes, seoRes] = await Promise.all([
          fetch('/api/admin/ai/optimize-section/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'optimize_intro', title, topic: focusKeyword || title, category: selectedCategory }),
          }).then((r) => r.json()),
          fetch('/api/admin/ai/optimize-section/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'optimize_content', title, topic: focusKeyword || title, category: selectedCategory }),
          }).then((r) => r.json()),
          fetch('/api/admin/ai/optimize-section/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'seo_meta', title, topic: focusKeyword || title, category: selectedCategory }),
          }).then((r) => r.json()),
        ]);

        if (introRes.introHtml) setIntroHtml(introRes.introHtml);
        if (introRes.excerpt) setExcerpt(introRes.excerpt);
        if (contentRes.contentHtml) setContentHtml(contentRes.contentHtml);
        if (seoRes.seoTitle) setSeoTitle(seoRes.seoTitle);
        if (seoRes.seoDescription) setSeoDescription(seoRes.seoDescription);
        setSuccess('Full article sections successfully optimized with AI!');
      }
    } catch (e: any) {
      setError(e.message || 'Error executing AI optimization.');
    } finally {
      setAiLoading(null);
    }
  };

  // Item handlers
  const addItem = () => {
    setItems([
      ...items,
      {
        heading: `Detalle Seleccionado #${items.length + 1}`,
        description_html: '<p>Diseño exclusivo con acabados de primera calidad, listo para entregar como regalo.</p>',
        pros: ['Presentación para regalo', 'Materiales sostenibles', 'Envío rápido 24-48h'],
        button_label: 'Ver en Amazon España',
        merchant: 'Amazon España',
        price: '29,99 €',
        url: `/go/regalo-detalle-${items.length + 1}/`,
      },
    ]);
  };

  const updateItem = (index: number, patch: Partial<GiftItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    setItems(updated);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setItems(updated);
  };

  const cloneItem = (index: number) => {
    const itemToClone = items[index];
    const cloned = { ...itemToClone, heading: `${itemToClone.heading} (Copia)` };
    const updated = [...items];
    updated.splice(index + 1, 0, cloned);
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // FAQ handlers
  const addFaq = () => {
    setFaqs([...faqs, { q: '¿Cuál es el mejor regalo para esta ocasión?', a: 'Los regalos personalizados y las experiencias conjuntas son los más valorados.' }]);
  };

  const updateFaq = (index: number, patch: Partial<FaqItem>) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], ...patch };
    setFaqs(updated);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, idx) => idx !== index));
  };

  // Media Picker selector
  const handleSelectMedia = (url: string) => {
    if (mediaTarget === 'hero') {
      setHeroImage(url);
    } else if (mediaTarget && typeof mediaTarget === 'object') {
      updateItem(mediaTarget.itemIndex, { image: url });
    }
    setShowMediaPicker(false);
    setMediaTarget(null);
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload: Partial<Post> = {
      title,
      slug,
      type,
      status,
      primary_category_id: primaryCatId || null,
      category_ids: categoryIds.length ? categoryIds : primaryCatId ? [primaryCatId] : [],
      author_id: authorId || null,
      excerpt,
      hero_image: heroImage,
      hero_alt: heroAlt,
      featured,
      editor_pick: editorPick,
      intro_html: introHtml,
      content_html: contentHtml,
      items,
      faqs,
      focus_keyword: focusKeyword,
      seo_title: seoTitle,
      seo_description: seoDescription,
      canonical_url: canonicalUrl,
      robots,
    };

    try {
      const url = isNew ? '/api/admin/posts/' : `/api/admin/posts/${initialPost?.id}/`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save post');
        setLoading(false);
        return;
      }

      setSuccess('Post saved successfully!');
      setLoading(false);

      if (isNew) {
        router.push(`/admin/posts/${data.id}/`);
      } else {
        router.refresh();
      }
    } catch {
      setError('An error occurred while saving.');
      setLoading(false);
    }
  };

  // Filtered media in picker
  const filteredMedia = mediaFiles.filter(
    (m) =>
      !mediaSearch ||
      m.name.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      m.original_name.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSave}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <Link href="/admin/posts/" style={{ fontSize: '0.84rem', color: '#69707d', textDecoration: 'none' }}>
            ← Back to Posts
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '4px 0 0', color: '#171a35' }}>
            {isNew ? 'Create New Post' : `Edit: ${title || 'Post'}`}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isNew && initialPost && initialPost.status === 'published' && (
            <Link href={postPath(initialPost as Post)} target="_blank" className="btn-secondary">
              View Live ↗
            </Link>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Post'}
          </button>
        </div>
      </div>

      {/* AI Assistant Quick Toolbar */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          border: '1px solid #bfdbfe',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <div>
            <strong style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>AI Section Optimizer Studio</strong>
            <div style={{ fontSize: '0.78rem', color: '#3b82f6' }}>
              One-click enhancements powered by Spanish gift-guide SEO models
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('optimize_title')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#ffffff' }}
          >
            {aiLoading === 'optimize_title' ? '⏳...' : '✨ Optimize Title'}
          </button>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('optimize_intro')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#ffffff' }}
          >
            {aiLoading === 'optimize_intro' ? '⏳...' : '✨ Polish Intro'}
          </button>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('optimize_content')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#ffffff' }}
          >
            {aiLoading === 'optimize_content' ? '⏳...' : '✨ Polish Guide'}
          </button>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('generate_items')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#ffffff' }}
          >
            {aiLoading === 'generate_items' ? '⏳...' : '✨ Suggest Items (+5)'}
          </button>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('generate_faqs')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#ffffff' }}
          >
            {aiLoading === 'generate_faqs' ? '⏳...' : '✨ Generate FAQs'}
          </button>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('seo_meta')}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#ffffff' }}
          >
            {aiLoading === 'seo_meta' ? '⏳...' : '✨ SEO Meta'}
          </button>
          <button
            type="button"
            disabled={!!aiLoading}
            onClick={() => handleAiOptimize('optimize_all')}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#2563eb' }}
          >
            {aiLoading === 'optimize_all' ? 'Optimizing...' : '⚡ Full Auto-Optimize'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fee4e2',
            border: '1px solid #fecdca',
            borderRadius: '8px',
            color: '#b42318',
            marginBottom: '20px',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            background: '#e6f7ed',
            border: '1px solid #a6f4c5',
            borderRadius: '8px',
            color: '#027a48',
            marginBottom: '20px',
            fontSize: '0.88rem',
          }}
        >
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📝 Basic &amp; Content
        </button>
        {type === 'gift' && (
          <button
            type="button"
            className={`admin-tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            🛍️ Product Picks ({items.length})
          </button>
        )}
        <button
          type="button"
          className={`admin-tab ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          ❓ FAQs Accordion ({faqs.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          🎯 SEO, Social &amp; Schema
        </button>
      </div>

      {/* ── TAB 1: BASIC & CONTENT ─────────────────── */}
      {activeTab === 'content' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            <div className="admin-card">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="post-title">
                    Post Title *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAiOptimize('optimize_title')}
                    disabled={!!aiLoading}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ✨ AI Re-hook Title
                  </button>
                </div>
                <input
                  id="post-title"
                  className="form-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. 40 Mejores Regalos para Esposa..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-slug">
                  URL Slug *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="post-slug"
                    className="form-input"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <button type="button" className="btn-secondary" onClick={() => setSlug(slugify(title))}>
                    Auto-slug
                  </button>
                </div>
                <div className="form-hint">
                  Path on live site: <code>{type === 'blog' ? `/blog/${slug}/` : `/${slug}/`}</code>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="post-excerpt">
                  Excerpt / Editorial Deck
                </label>
                <textarea
                  id="post-excerpt"
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief introductory summary shown in cards and above article..."
                />
              </div>

              {type === 'gift' ? (
                <>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="intro-html">
                        Introduction HTML
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAiOptimize('optimize_intro')}
                        disabled={!!aiLoading}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✨ AI Expand Intro
                      </button>
                    </div>
                    <textarea
                      id="intro-html"
                      className="form-textarea"
                      style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      value={introHtml}
                      onChange={(e) => setIntroHtml(e.target.value)}
                      placeholder="<p>Write an engaging opening for this gift guide...</p>"
                    />
                    <div className="form-hint">Renders before the product card list on the live page.</div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="content-html">
                        Buying Guide Advice &amp; Bottom Line (HTML)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAiOptimize('optimize_content')}
                        disabled={!!aiLoading}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✨ AI Generate Advice
                      </button>
                    </div>
                    <textarea
                      id="content-html"
                      className="form-textarea"
                      style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      value={contentHtml}
                      onChange={(e) => setContentHtml(e.target.value)}
                      placeholder="<h2>Consejos de Compra</h2><p>Pautas para elegir el detalle perfecto...</p>"
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" htmlFor="full-content-html">
                      Full Article Body Content (HTML)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAiOptimize('optimize_content')}
                      disabled={!!aiLoading}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✨ AI Polish Body
                    </button>
                  </div>
                  <textarea
                    id="full-content-html"
                    className="form-textarea"
                    style={{ minHeight: '340px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder="<h2>Section heading</h2><p>Article body paragraphs...</p>"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            <div className="admin-card">
              <div className="form-group">
                <label className="form-label">Post Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value as Post['type'])}>
                  <option value="gift">Gift Guide (Numbered Cards)</option>
                  <option value="blog">Blog Post (/blog/)</option>
                  <option value="page">Static Page (/sobre-nosotros/)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Publishing Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as Post['status'])}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="planned">Planned</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Category</label>
                <select className="form-select" value={primaryCatId} onChange={(e) => setPrimaryCatId(e.target.value)}>
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.group}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Author</label>
                <select className="form-select" value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Hero Cover Image</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTarget('hero');
                      setShowMediaPicker(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    🖼️ Pick from Media
                  </button>
                </div>
                <input
                  className="form-input"
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="https://..."
                />
                {heroImage && (
                  <div style={{ marginTop: '8px', height: '100px', borderRadius: '6px', overflow: 'hidden', background: '#f1f5f9' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroImage} alt="Hero preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Hero Alt Text (SEO)</label>
                <input className="form-input" type="text" value={heroAlt} onChange={(e) => setHeroAlt(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                  Featured Story (Homepage top slot)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editorPick} onChange={(e) => setEditorPick(e.target.checked)} />
                  Editor’s Pick
                </label>
              </div>
            </div>

            {/* Additional Categories */}
            <div className="admin-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px' }}>Additional Categories</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {categories.map((c) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(c.id)}
                      onChange={() => handleCategoryToggle(c.id)}
                    />
                    {c.name} <small style={{ color: '#8c93a4' }}>({c.group})</small>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PRODUCT PICKS (GIFT ITEMS) ─────── */}
      {activeTab === 'items' && (
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 className="admin-card-title">Numbered Product Recommendations ({items.length})</h2>
              <p style={{ margin: '4px 0 0', color: '#69707d', fontSize: '0.84rem' }}>
                Each item renders as a high-converting product card with an image, price, pros list, and affiliate button.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleAiOptimize('generate_items')}
                disabled={!!aiLoading}
                className="btn-secondary"
                style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}
              >
                {aiLoading === 'generate_items' ? 'Generating...' : '✨ AI Suggest 5 Items'}
              </button>
              <button type="button" className="btn-primary" onClick={addItem}>
                + Add Product Pick
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>No product picks yet. Click &quot;+ Add Product Pick&quot; or use &quot;✨ AI Suggest 5 Items&quot;.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((it, idx) => (
                <div key={idx} className="admin-item-card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: '#3349b5',
                          color: '#ffffff',
                          borderRadius: '9999px',
                          width: '24px',
                          height: '24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <strong style={{ color: '#1e293b' }}>{it.heading || `Item #${idx + 1}`}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === items.length - 1}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => cloneItem(idx)}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                        title="Clone Item"
                      >
                        📋
                      </button>
                      <button type="button" className="btn-danger" onClick={() => removeItem(idx)}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label className="form-label">Heading / Product Name *</label>
                      <input
                        className="form-input"
                        type="text"
                        value={it.heading}
                        onChange={(e) => updateItem(idx, { heading: e.target.value })}
                        placeholder="e.g. Lámpara LED Luna 3D Grabada"
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Merchant / Network</label>
                      <select
                        className="form-select"
                        value={it.merchant || 'Amazon España'}
                        onChange={(e) => {
                          const mch = e.target.value;
                          const btnMap: Record<string, string> = {
                            'Amazon España': 'Ver en Amazon España',
                            'El Corte Inglés (Awin)': 'Ver en El Corte Inglés',
                            'eBay Partner Network': 'Ver en eBay',
                            'Walmart Impact': 'Ver en Walmart',
                          };
                          updateItem(idx, { merchant: mch, button_label: btnMap[mch] || `Ver en ${mch}` });
                        }}
                      >
                        <option value="Amazon España">Amazon España (Associates)</option>
                        <option value="El Corte Inglés (Awin)">El Corte Inglés (Awin)</option>
                        <option value="eBay Partner Network">eBay Partner Network</option>
                        <option value="Walmart Impact">Walmart Impact</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Product Image URL</label>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaTarget({ itemIndex: idx });
                            setShowMediaPicker(true);
                          }}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          🖼️ Pick from Media Library
                        </button>
                      </div>
                      <input
                        className="form-input"
                        type="text"
                        value={it.image || ''}
                        onChange={(e) => updateItem(idx, { image: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Price</label>
                      <input
                        className="form-input"
                        type="text"
                        value={it.price || ''}
                        onChange={(e) => updateItem(idx, { price: e.target.value })}
                        placeholder="e.g. 29,99 €"
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Button Label</label>
                      <input
                        className="form-input"
                        type="text"
                        value={it.button_label || ''}
                        onChange={(e) => updateItem(idx, { button_label: e.target.value })}
                        placeholder="Ver en Amazon España"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Affiliate Tracking Outbound Link (/go/...)</label>
                    <input
                      className="form-input"
                      type="text"
                      value={it.url || ''}
                      onChange={(e) => updateItem(idx, { url: e.target.value })}
                      placeholder="/go/slug-del-producto/"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description HTML</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '70px' }}
                      value={it.description_html || ''}
                      onChange={(e) => updateItem(idx, { description_html: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pros List (one per line)</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '65px' }}
                      value={(it.pros || []).join('\n')}
                      onChange={(e) =>
                        updateItem(idx, {
                          pros: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Materiales sostenibles&#10;Grabado artesanal&#10;Envío 24-48h"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FAQS ───────────────────────────── */}
      {activeTab === 'faqs' && (
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 className="admin-card-title">Frequently Asked Questions ({faqs.length})</h2>
              <p style={{ margin: '4px 0 0', color: '#69707d', fontSize: '0.84rem' }}>
                FAQs automatically render accordion boxes on the page and emit Google FAQPage JSON-LD schema.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleAiOptimize('generate_faqs')}
                disabled={!!aiLoading}
                className="btn-secondary"
                style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}
              >
                {aiLoading === 'generate_faqs' ? 'Generating...' : '✨ AI Generate FAQs'}
              </button>
              <button type="button" className="btn-primary" onClick={addFaq}>
                + Add FAQ
              </button>
            </div>
          </div>

          {faqs.length === 0 ? (
            <div className="empty-state">
              <p>No FAQs added yet. Click &quot;+ Add FAQ&quot; or use &quot;✨ AI Generate FAQs&quot;.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {faqs.map((faq, idx) => (
                <div key={idx} className="admin-item-card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#1e293b' }}>Question #{idx + 1}</strong>
                    <button type="button" className="btn-danger" onClick={() => removeFaq(idx)}>
                      Remove
                    </button>
                  </div>
                  <div className="form-group">
                    <input
                      className="form-input"
                      type="text"
                      value={faq.q}
                      onChange={(e) => updateFaq(idx, { q: e.target.value })}
                      placeholder="e.g. ¿Cuánto tiempo tarda el envío en España?"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '70px' }}
                      value={faq.a}
                      onChange={(e) => updateFaq(idx, { a: e.target.value })}
                      placeholder="Respuesta detallada con información útil..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: SEO & SOCIAL ───────────────────── */}
      {activeTab === 'seo' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}>
              SEO &amp; OpenGraph Settings
            </h2>
            <button
              type="button"
              onClick={() => handleAiOptimize('seo_meta')}
              disabled={!!aiLoading}
              className="btn-secondary"
              style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}
            >
              {aiLoading === 'seo_meta' ? 'Optimizing...' : '✨ AI Optimize Meta Tags'}
            </button>
          </div>

          {/* Live SEO Score Gauge */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              gap: '20px',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>SEO Title: </span>
              <strong style={{ color: seoTitle.length >= 40 && seoTitle.length <= 60 ? '#16a34a' : '#d97706' }}>
                {seoTitle.length} / 60 chars {seoTitle.length >= 40 && seoTitle.length <= 60 ? '✓' : '(Recommended: 40-60)'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Meta Description: </span>
              <strong style={{ color: seoDescription.length >= 120 && seoDescription.length <= 160 ? '#16a34a' : '#d97706' }}>
                {seoDescription.length} / 160 chars {seoDescription.length >= 120 && seoDescription.length <= 160 ? '✓' : '(Recommended: 120-160)'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Focus Keyword: </span>
              <strong style={{ color: focusKeyword ? '#16a34a' : '#dc2626' }}>
                {focusKeyword ? `"${focusKeyword}" ✓` : 'Missing ✗'}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="focus-keyword">
              Focus Keyword
            </label>
            <input
              id="focus-keyword"
              className="form-input"
              type="text"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder="e.g. regalos 1 ano noviazgo"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="seo-title">
              SEO Title (Overrides page &lt;title&gt;)
            </label>
            <input
              id="seo-title"
              className="form-input"
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Defaults to: Title | Loveable Blog"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="seo-description">
              Meta Description
            </label>
            <textarea
              id="seo-description"
              className="form-textarea"
              style={{ minHeight: '80px' }}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Recommended: 140 - 160 characters"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="canonical-url">
                Canonical URL
              </label>
              <input
                id="canonical-url"
                className="form-input"
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="Leave blank for self-canonical"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="robots">
                Robots Meta
              </label>
              <input
                id="robots"
                className="form-input"
                type="text"
                value={robots}
                onChange={(e) => setRobots(e.target.value)}
                placeholder="index, follow, max-image-preview:large"
              />
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => {
            setShowMediaPicker(false);
            setMediaTarget(null);
          }}
        >
          <div
            className="admin-card"
            style={{ width: '700px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', padding: '24px', background: '#ffffff', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                Select Image from Cloudflare / Supabase Media Library
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowMediaPicker(false);
                  setMediaTarget(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Search assets by name..."
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {filteredMedia.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMedia(m.url)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  title={m.name}
                >
                  <div style={{ height: '95px', background: '#f1f5f9' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '6px', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
