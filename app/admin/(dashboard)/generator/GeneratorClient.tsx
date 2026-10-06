'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Category, Author, Keyword, Post } from '@/lib/types';

interface GeneratorClientProps {
  categories: Category[];
  authors: Author[];
  sampleKeywords: Keyword[];
  totalPlanned: number;
  hasGeminiKey: boolean;
}

export function GeneratorClient({
  categories,
  authors,
  sampleKeywords,
  totalPlanned,
  hasGeminiKey,
}: GeneratorClientProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'links'>('single');

  // Single post form state
  const [sourceUrl, setSourceUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [postType, setPostType] = useState<'gift' | 'blog'>('gift');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState(authors[0]?.id || '');
  const [publish, setPublish] = useState(true);

  // Status & results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPost, setGeneratedPost] = useState<Post | null>(null);
  const [genMeta, setGenMeta] = useState<{ source?: string; scraped?: boolean } | null>(null);

  // Batch form state
  const [batchCount, setBatchCount] = useState(5);
  const [batchCluster, setBatchCluster] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<{ keyword: string; slug: string; title: string; id: string }>>([]);

  // Links form state
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksResult, setLinksResult] = useState<{ linksCreated: number; suggestionsCount: number } | null>(null);

  const handleSingleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceUrl.trim()) {
      setError('Please provide either a topic/keyword or a source URL from blog.loveable.us');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedPost(null);

    try {
      const res = await fetch('/api/admin/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          source_url: sourceUrl.trim() || undefined,
          post_type: postType,
          category_id: categoryId || undefined,
          author_id: authorId || undefined,
          publish,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate post');
        setLoading(false);
        return;
      }

      setGeneratedPost(data.post);
      setGenMeta({ source: data.source, scraped: data.scraped });
      setLoading(false);
    } catch {
      setError('An error occurred during generation');
      setLoading(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!confirm(`Generate ${batchCount} Spanish articles automatically from planned keywords?`)) return;
    setBatchLoading(true);
    setBatchResults([]);
    setError('');

    try {
      const res = await fetch('/api/admin/batch-generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: batchCount,
          cluster: batchCluster || undefined,
          publish: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate batch');
        setBatchLoading(false);
        return;
      }

      setBatchResults(data.generated || []);
      setBatchLoading(false);
    } catch {
      setError('Error occurred during batch generation');
      setBatchLoading(false);
    }
  };

  const handleBuildLinks = async () => {
    setLinksLoading(true);
    setLinksResult(null);
    try {
      const res = await fetch('/api/admin/internal-links/', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLinksResult({
          linksCreated: data.linksCreated || 0,
          suggestionsCount: data.suggestions?.length || 0,
        });
      } else {
        setError(data.error || 'Failed to build links');
      }
      setLinksLoading(false);
    } catch {
      setError('Error building internal links');
      setLinksLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#171a35' }}>
            AI Content Engine (Phase 2)
          </h1>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
            🇪🇸 Target: Spanish (es)
          </span>
          {hasGeminiKey ? (
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
              🟢 Google Gemini AI Active
            </span>
          ) : (
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
              🟡 Native Spanish Synthesis Engine Active
            </span>
          )}
        </div>
        <p style={{ margin: '6px 0 0', color: '#69707d', fontSize: '0.88rem' }}>
          Autonomous content generation pipeline: Research &rarr; Spanish Content &rarr; Curated Gift Items &rarr; SEO Schemas &rarr; Product Matching &rarr; Internal Links.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Post &amp; URL Cloner
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          Batch Generator ({totalPlanned} Planned URLs)
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'links' ? 'active' : ''}`}
          onClick={() => setActiveTab('links')}
        >
          Internal Link Graph
        </button>
      </div>

      {/* ── TAB 1: SINGLE POST GENERATOR ── */}
      {activeTab === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '24px' }}>
          <div className="admin-card">
            <h2 className="admin-card-title" style={{ marginBottom: '16px' }}>
              Generate Spanish Article
            </h2>

            <form onSubmit={handleSingleGenerate}>
              <div className="form-group">
                <label className="form-label">
                  Clone from blog.loveable.us URL (Optional)
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://blog.loveable.us/personalized-gifts-for-wife/"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: '#69707d', marginTop: '4px', display: 'block' }}>
                  If provided, scrapes original headings, gift items &amp; prices, then translates/enriches into native Spanish.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Topic / Target Keyword</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Personalized gifts for boyfriend"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Sample keywords quick-pick */}
              {sampleKeywords.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: '#69707d' }}>
                    Quick pick from planned keyword pipeline:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                    {sampleKeywords.slice(0, 10).map((kw) => (
                      <button
                        key={kw.id}
                        type="button"
                        onClick={() => {
                          setTopic(kw.keyword);
                          setPostType(kw.post_type === 'blog' ? 'blog' : 'gift');
                        }}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: '#334155',
                        }}
                      >
                        + {kw.keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Post Type</label>
                  <select
                    className="form-select"
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as 'gift' | 'blog')}
                  >
                    <option value="gift">Gift Guide (with Numbered Product Items)</option>
                    <option value="blog">Blog Post (with Table of Contents)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category (Auto if empty)</label>
                  <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Auto-detect best category</option>
                    {categories.filter((c) => c.group !== 'hub').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Author</label>
                  <select
                    className="form-select"
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={publish}
                      onChange={(e) => setPublish(e.target.checked)}
                    />
                    Publish immediately to live site
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="submit"
                  className="button"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? '⚡ Generating Spanish Content...' : '⚡ Generate Spanish Article'}
                </button>
              </div>
            </form>
          </div>

          {/* Results preview panel */}
          <div className="admin-card">
            <h2 className="admin-card-title" style={{ marginBottom: '16px' }}>
              Generation Preview
            </h2>

            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#69707d' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
                <strong style={{ fontSize: '1rem', color: '#171a35' }}>
                  Synthesizing Native Spanish Content...
                </strong>
                <p style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>
                  Researching topic, crafting engaging hook, curating gift items and configuring SEO schemas.
                </p>
              </div>
            )}

            {!loading && !generatedPost && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <p>Fill out the parameters on the left and click <strong>Generate</strong> to produce a Spanish gift guide or blog article.</p>
              </div>
            )}

            {!loading && generatedPost && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
                  <span style={{ color: '#047857', fontWeight: 600, fontSize: '0.85rem' }}>
                    ✓ Article generated successfully ({genMeta?.source === 'gemini' ? 'Gemini 2.5' : 'Native Spanish Engine'})
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                    Title (Spanish)
                  </span>
                  <h3 style={{ margin: '4px 0 8px', fontSize: '1.15rem', color: '#1e293b' }}>
                    {generatedPost.title}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#0284c7' }}>
                    URL: /{generatedPost.slug}/
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                    Excerpt
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                    {generatedPost.excerpt}
                  </p>
                </div>

                {generatedPost.items && generatedPost.items.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                      Curated Spanish Gift Items ({generatedPost.items.length})
                    </span>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: '#334155' }}>
                      {generatedPost.items.map((it, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{it.heading}</strong> — {it.price || '€'} ({it.merchant || 'Store'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedPost.faqs && generatedPost.faqs.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                      Spanish FAQs ({generatedPost.faqs.length})
                    </span>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {generatedPost.faqs.map((f, idx) => (
                        <div key={idx} style={{ fontSize: '0.82rem', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                          <strong>Q: {f.q}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <Link
                    href={`/admin/posts/${generatedPost.id}/`}
                    className="button"
                    style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                  >
                    Edit in Post Editor &rarr;
                  </Link>
                  <a
                    href={`/${generatedPost.slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-light"
                    style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                  >
                    View Live Site &nearr;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: BATCH GENERATOR ── */}
      {activeTab === 'batch' && (
        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: '8px' }}>
            Batch Content Generation
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 20px' }}>
            Automatically process the 1,651 planned target URLs seeded from blog.loveable.us and generate high-ranking Spanish articles in batch.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ width: '160px' }}>
              <label className="form-label">Batch Size</label>
              <select
                className="form-select"
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
              >
                <option value={3}>3 Articles</option>
                <option value={5}>5 Articles</option>
                <option value={10}>10 Articles</option>
                <option value={15}>15 Articles</option>
              </select>
            </div>

            <div style={{ width: '220px' }}>
              <label className="form-label">Target Cluster</label>
              <select
                className="form-select"
                value={batchCluster}
                onChange={(e) => setBatchCluster(e.target.value)}
              >
                <option value="">All Clusters</option>
                <option value="recipients">Recipients (Women, Men, Mom, Dad...)</option>
                <option value="occasions">Occasions (Anniversary, Birthday...)</option>
                <option value="interests">Interests (Sports, Animals...)</option>
                <option value="blog">Blog</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                className="button"
                disabled={batchLoading}
                onClick={handleBatchGenerate}
              >
                {batchLoading ? '🚀 Generating Batch...' : `🚀 Generate ${batchCount} Articles`}
              </button>
            </div>
          </div>

          {batchResults.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#166534' }}>
                ✓ Generated {batchResults.length} Spanish Articles:
              </h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Spanish Title</th>
                    <th>URL Slug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.keyword}</strong></td>
                      <td>{r.title}</td>
                      <td><code>/{r.slug}/</code></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link href={`/admin/posts/${r.id}/`} style={{ fontSize: '0.8rem', color: '#0284c7' }}>
                            Edit
                          </Link>
                          <a href={`/${r.slug}/`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#059669' }}>
                            View &nearr;
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: INTERNAL LINK BUILDER ── */}
      {activeTab === 'links' && (
        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: '8px' }}>
            Semantic Internal Linking Graph
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 20px' }}>
            Automatically scans all published Spanish articles and cross-links them to relevant category hubs and related articles based on semantic anchor phrases.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              className="button"
              disabled={linksLoading}
              onClick={handleBuildLinks}
            >
              {linksLoading ? '🔗 Analyzing and Building Link Graph...' : '🔗 Build & Optimize Internal Link Graph'}
            </button>
          </div>

          {linksResult && (
            <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Internal Link Graph Updated!</h4>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Successfully recorded <strong>{linksResult.linksCreated}</strong> new internal links across <strong>{linksResult.suggestionsCount}</strong> semantic anchor opportunities.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
