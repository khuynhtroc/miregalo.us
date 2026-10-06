'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Keyword } from '@/lib/types';

interface KeywordExplorerProps {
  initialKeywords: Keyword[];
  total: number;
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function KeywordExplorer({ initialKeywords, total }: KeywordExplorerProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [cluster, setCluster] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(total);
  const [loading, setLoading] = useState(false);

  const clusters = [
    'Mamá',
    'Papá',
    'Novia',
    'Novio',
    'Esposa',
    'Esposo',
    'Abuela',
    'Abuelo',
    'Hermana',
    'Hermano',
    'Hija',
    'Hijo',
    'Amiga',
    'Amigo',
    'Suegra',
    'Suegro',
    'Cuñada',
    'Cuñado',
    'Maestra',
    'Maestro',
    'Cumpleaños',
    'Navidad',
    'San Valentín',
    'Aniversario',
    'Día de la Madre',
    'Día del Padre',
  ];

  const fetchKeywords = async (newPage = 1, newCluster = cluster, newStatus = status, newQ = q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: '50',
      });
      if (newCluster) params.set('cluster', newCluster);
      if (newStatus) params.set('status', newStatus);
      if (newQ) params.set('q', newQ);

      const res = await fetch(`/api/admin/keywords/?${params.toString()}`);
      const data = await res.json();
      setKeywords(data.rows || []);
      setTotalCount(data.total || 0);
      setPage(newPage);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeywords(1, cluster, status, q);
  };

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const updateStatus = async (id: string, newStatus: Keyword['status']) => {
    try {
      await fetch('/api/admin/keywords/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setKeywords(keywords.map((k) => (k.id === id ? { ...k, status: newStatus } : k)));
    } catch {
      // ignore
    }
  };

  const handleQuickAiGenerate = async (kw: Keyword) => {
    setGeneratingId(kw.id);
    try {
      const slug = kw.target_path.replace(/^\/+|\/+$/g, '');
      const res = await fetch('/api/admin/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: kw.keyword,
          target_slug: slug,
          post_type: kw.post_type,
          publish: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setKeywords(
          keywords.map((k) =>
            k.id === kw.id ? { ...k, status: 'published', post_id: data.post?.id || null } : k
          )
        );
      }
    } catch {
      // non-fatal
    } finally {
      setGeneratingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px', color: '#171a35' }} suppressHydrationWarning>
          Planned URL Map &amp; Keywords ({formatNumber(totalCount)})
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.88rem' }}>
          Seeded directly from <code>blog.loveable.us</code>. Ready for <strong>Phase 2: AI Content Engine</strong>.
        </p>
      </div>

      {/* Phase 2 Bridge Notification */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #eef1ff 0%, #fff1f3 100%)',
          border: '1px solid #c7d2fe',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <div>
            <strong style={{ color: '#171a35' }}>Phase 2: AI Content Engine Ready</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#454852' }}>
              These 1,651 URL structures and target paths are pre-indexed into the database. When Phase 2 begins, the AI pipeline will research keywords, match affiliate products, and draft SEO articles automatically into Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* Filter form */}
      <div className="admin-card" style={{ padding: '16px' }}>
        <form onSubmit={handleFilter} className="admin-search-bar" style={{ margin: 0 }}>
          <input
            className="form-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search keyword or path..."
            style={{ maxWidth: '320px' }}
          />

          <select
            className="form-select"
            value={cluster}
            onChange={(e) => {
              setCluster(e.target.value);
              fetchKeywords(1, e.target.value, status, q);
            }}
            style={{ maxWidth: '180px' }}
          >
            <option value="">All Clusters</option>
            {clusters.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              fetchKeywords(1, cluster, e.target.value, q);
            }}
            style={{ maxWidth: '160px' }}
          >
            <option value="">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="researching">Researching</option>
            <option value="writing">Writing</option>
            <option value="published">Published</option>
            <option value="skipped">Skipped</option>
          </select>

          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '85px' }}>ID</th>
              <th>Primary Keyword & Intent</th>
              <th>Target URL Path</th>
              <th>Cluster</th>
              <th>Action</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Generate</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => {
              const cleanSlug = kw.target_path.replace(/^\/blog\//, '').replace(/^\/|\/$/g, '');
              return (
                <tr key={kw.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>
                      {kw.id}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#171a35' }}>{kw.keyword}</strong>
                    {kw.intent && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Intent: {kw.intent}
                      </div>
                    )}
                  </td>
                  <td>
                    <a
                      href={kw.target_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.82rem' }}
                    >
                      {kw.target_path} ↗
                    </a>
                    {kw.target_url_id && (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>
                        Ref: {kw.target_url_id}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>{kw.cluster}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: kw.action === 'PRIMARY' ? '#eff6ff' : '#f1f5f9',
                        color: kw.action === 'PRIMARY' ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {kw.action || 'MERGE'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: kw.priority === 'P1' ? '#fee2e2' : '#f1f5f9',
                        color: kw.priority === 'P1' ? '#991b1b' : '#475569',
                      }}
                    >
                      {kw.priority || 'P1'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={kw.status}
                      onChange={(e) => updateStatus(kw.id, e.target.value as Keyword['status'])}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d0d5dd',
                        fontSize: '0.78rem',
                        background: '#fff',
                      }}
                    >
                      <option value="planned">Planned</option>
                      <option value="researching">Researching</option>
                      <option value="writing">Writing</option>
                      <option value="published">Published</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleQuickAiGenerate(kw)}
                        disabled={generatingId === kw.id}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {generatingId === kw.id ? '⚡ Generating...' : '⚡ AI Post'}
                      </button>
                      <Link
                        href={`/admin/posts/new/?slug=${encodeURIComponent(cleanSlug)}&title=${encodeURIComponent(
                          kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)
                        )}&type=${kw.post_type}`}
                        className="btn-primary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        + Draft
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#fafafc' }}>
          <span style={{ fontSize: '0.84rem', color: '#69707d' }} suppressHydrationWarning>
            Page {page} of {totalPages || 1} ({formatNumber(totalCount)} items)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => fetchKeywords(page - 1)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={page >= totalPages || loading}
              onClick={() => fetchKeywords(page + 1)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
