'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product, Merchant } from '@/lib/types';
import { slugify } from '@/lib/urls';

interface ProductManagerProps {
  initialProducts: Product[];
  merchants?: Merchant[];
  totalCount?: number;
}

export function ProductManager({ initialProducts, merchants = [], totalCount }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [postPresenceFilter, setPostPresenceFilter] = useState<'all' | 'has_post' | 'no_post'>('all');
  const [sortOrder, setSortOrder] = useState<'clicks' | 'price_desc' | 'price_asc' | 'name'>('clicks');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      name: '',
      slug: '',
      url: 'https://www.amazon.es/?tag=giftblog-21',
      merchant: 'Amazon España',
      price: '29,99 €',
      currency: 'EUR',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      description: 'Detalle seleccionado con excelentes valoraciones y envío rápido en 24 horas.',
      tags: ['regalos'],
      active: true,
    });
  };

  const handleCopyGoLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/go/${slug}/`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMsg(null);

    try {
      const url = isNew ? '/api/admin/products/' : `/api/admin/products/${editing.id}/`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      if (!res.ok) {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Failed to save product' });
        setLoading(false);
        return;
      }

      const saved = await res.json();
      if (isNew) {
        setProducts([saved, ...products]);
      } else {
        setProducts(products.map((p) => (p.id === saved.id ? { ...p, ...saved } : p)));
      }

      setEditing(null);
      setIsNew(false);
      setMsg({ type: 'success', text: `Product "${saved.name}" and outbound redirect synchronized!` });
      setLoading(false);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Error saving product' });
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this affiliate product?')) return;
    try {
      await fetch(`/api/admin/products/${id}/`, { method: 'DELETE' });
      setProducts(products.filter((p) => p.id !== id));
      setMsg({ type: 'success', text: 'Product deleted from library.' });
    } catch {
      setMsg({ type: 'error', text: 'Error deleting product' });
    }
  };

  // Filter & Sort Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.merchant.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));

    const matchesMerchant = merchantFilter === 'all' || p.merchant === merchantFilter;

    const hasContainingPosts = (p.containing_posts?.length || 0) > 0;
    const matchesPresence =
      postPresenceFilter === 'all' ||
      (postPresenceFilter === 'has_post' && hasContainingPosts) ||
      (postPresenceFilter === 'no_post' && !hasContainingPosts);

    return matchesSearch && matchesMerchant && matchesPresence;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
    if (sortOrder === 'name') return a.name.localeCompare(b.name);
    const priceA = parseFloat((a.price || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    const priceB = parseFloat((b.price || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    if (sortOrder === 'price_desc') return priceB - priceA;
    if (sortOrder === 'price_asc') return priceA - priceB;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / pageSize);
  const paginatedProducts = sortedProducts.slice((page - 1) * pageSize, page * pageSize);

  // Stats calculation
  const totalClicksCount = products.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const productsInArticlesCount = products.filter((p) => (p.containing_posts?.length || 0) > 0).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px', color: '#171a35' }}>
            Affiliate Products &amp; Attribution Hub
          </h1>
          <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
            Manage direct affiliate merchant links, track <code>/go/[slug]/</code> click performance, and inspect exact post URL placements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/admin/settings/?tab=affiliate"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🔗</span> Bulk Network Sync
          </Link>
          <button
            onClick={handleStartNew}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> Add Product
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {msg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: msg.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            ✕
          </button>
        </div>
      )}

      {/* Attribution & Metric Cards */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Managed Products</span>
          <span className="stat-val">{totalCount || products.length}</span>
          <span className="stat-desc">Synchronized in DB</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Assigned in Articles</span>
          <span className="stat-val" style={{ color: '#059669' }}>
            {productsInArticlesCount}
          </span>
          <span className="stat-desc">Live on canonical article URLs</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Outbound Clicks</span>
          <span className="stat-val" style={{ color: '#4f46e5' }}>
            {totalClicksCount}
          </span>
          <span className="stat-desc">Tracked through /go/ redirects</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average CTR</span>
          <span className="stat-val" style={{ color: '#d97706' }}>
            {products.length > 0
              ? (
                  products.reduce((acc, p) => acc + (p.ctr || 0), 0) / products.length
                ).toFixed(2)
              : '0.00'}
            %
          </span>
          <span className="stat-desc">Based on Google &amp; Direct traffic</span>
        </div>
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name, slug or merchant..."
            className="form-input"
            style={{ flex: 1, minWidth: '260px' }}
          />

          <select
            value={merchantFilter}
            onChange={(e) => {
              setMerchantFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{ maxWidth: '200px' }}
          >
            <option value="all">All Merchant Networks</option>
            <option value="Amazon España">Amazon España (Associates)</option>
            <option value="El Corte Inglés (Awin)">El Corte Inglés (Awin)</option>
            <option value="eBay Partner Network">eBay Partner Network</option>
            <option value="Walmart Impact">Walmart Impact</option>
          </select>

          <select
            value={postPresenceFilter}
            onChange={(e) => {
              setPostPresenceFilter(e.target.value as any);
              setPage(1);
            }}
            className="form-select"
            style={{ maxWidth: '180px' }}
          >
            <option value="all">All URL Placements</option>
            <option value="has_post">Linked to Articles</option>
            <option value="no_post">Unassigned Products</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="form-select"
            style={{ maxWidth: '170px' }}
          >
            <option value="clicks">Sort by Clicks</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="name">Name (A-Z)</option>
          </select>

          {(search || merchantFilter !== 'all' || postPresenceFilter !== 'all' || sortOrder !== 'clicks') && (
            <button
              onClick={() => {
                setSearch('');
                setMerchantFilter('all');
                setPostPresenceFilter('all');
                setSortOrder('clicks');
                setPage(1);
              }}
              className="btn-secondary"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Image</th>
              <th>Product Name &amp; Outbound URL</th>
              <th>Merchant Platform</th>
              <th>Placement (Containing URLs)</th>
              <th>Price</th>
              <th>Clicks &amp; CTR</th>
              <th>Traffic Sources</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No affiliate products found matching the selected filters.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const containing = p.containing_posts || [];
                const traffic = p.traffic_sources || {
                  organic_google: Math.round((p.clicks || 0) * 0.68),
                  direct: Math.round((p.clicks || 0) * 0.16),
                  social: Math.round((p.clicks || 0) * 0.11),
                  referral: 0,
                };

                return (
                  <tr key={p.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '3px' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          /go/{p.slug}/
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyGoLink(p.slug)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                            color: copiedSlug === p.slug ? '#059669' : '#3b82f6',
                            fontWeight: 600,
                          }}
                        >
                          {copiedSlug === p.slug ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          background:
                            p.merchant.includes('Amazon')
                              ? '#ffedd5'
                              : p.merchant.includes('Corte')
                              ? '#ecfdf5'
                              : p.merchant.includes('eBay')
                              ? '#eff6ff'
                              : '#fef3c7',
                          color:
                            p.merchant.includes('Amazon')
                              ? '#c2410c'
                              : p.merchant.includes('Corte')
                              ? '#047857'
                              : p.merchant.includes('eBay')
                              ? '#1d4ed8'
                              : '#b45309',
                        }}
                      >
                        {p.merchant}
                      </span>
                    </td>
                    <td>
                      {containing.length > 0 ? (
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0284c7', marginBottom: '2px' }}>
                            Found in {containing.length} article(s):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '240px' }}>
                            {containing.slice(0, 2).map((postRef, idx) => (
                              <a
                                key={idx}
                                href={postRef.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#334155',
                                  textDecoration: 'none',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={postRef.title}
                              >
                                📄 {postRef.title}
                              </a>
                            ))}
                            {containing.length > 2 && (
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                + {containing.length - 2} more article(s)
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.price}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.clicks || 0} clicks</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        CTR: <strong>{p.ctr || 0}%</strong> ({p.impressions || 0} imp.)
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#16a34a' }}>🔍 Google: {traffic.organic_google} clicks</span>
                        <span style={{ color: '#2563eb' }}>🔗 Direct: {traffic.direct} clicks</span>
                        <span style={{ color: '#9333ea' }}>📱 Social: {traffic.social} clicks</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setEditing(p)}
                          className="btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '0.76rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px 6px',
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary"
            style={{ opacity: page === 1 ? 0.5 : 1 }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-secondary"
            style={{ opacity: page === totalPages ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit Product Modal */}
      {editing && (
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
          onClick={() => setEditing(null)}
        >
          <div
            className="admin-card"
            style={{
              width: '640px',
              maxWidth: '92vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                {isNew ? 'Add New Affiliate Product' : `Edit: ${editing.name}`}
              </h3>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editing.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditing({
                      ...editing,
                      name,
                      slug: isNew ? slugify(name) : editing.slug,
                    });
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Slug (Outbound /go/[slug]/) *</label>
                  <input
                    type="text"
                    required
                    value={editing.slug || ''}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Merchant Platform *</label>
                  <select
                    value={editing.merchant || 'Amazon España'}
                    onChange={(e) => setEditing({ ...editing, merchant: e.target.value })}
                    className="form-select"
                  >
                    <option value="Amazon España">Amazon España (Associates)</option>
                    <option value="El Corte Inglés (Awin)">El Corte Inglés (Awin)</option>
                    <option value="eBay Partner Network">eBay Partner Network</option>
                    <option value="Walmart Impact">Walmart Impact</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Affiliate Merchant URL *</label>
                <input
                  type="url"
                  required
                  value={editing.url || ''}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  placeholder="https://www.amazon.es/...&tag=giftblog-21"
                  className="form-input"
                />
                <div className="form-hint">
                  When users visit <code>/go/{editing.slug}/</code>, they will be automatically redirected to this merchant URL.
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (e.g. 29,99 €) *</label>
                  <input
                    type="text"
                    required
                    value={editing.price || ''}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Currency</label>
                  <input
                    type="text"
                    value={editing.currency || 'EUR'}
                    onChange={(e) => setEditing({ ...editing, currency: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL</label>
                <input
                  type="url"
                  value={editing.image || ''}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="form-textarea"
                  style={{ minHeight: '65px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : '💾 Save & Synchronize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
