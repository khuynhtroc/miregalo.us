'use client';

import { useState } from 'react';
import type { CatalogUrl } from '@/lib/types';

interface UrlCatalogManagerProps {
  initialUrls: CatalogUrl[];
  total: number;
}

export function UrlCatalogManager({ initialUrls, total }: UrlCatalogManagerProps) {
  const [urls, setUrls] = useState<CatalogUrl[]>(initialUrls);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CatalogUrl | null>(null);
  const [msg, setMsg] = useState('');

  const types = [
    { label: 'All Types', value: '' },
    { label: 'ROOT', value: 'ROOT' },
    { label: 'SILO Hub', value: 'SILO' },
    { label: 'Recipients (20)', value: 'RECIPIENT' },
    { label: 'Personalized (20)', value: 'RECIPIENT_ATTRIBUTE' },
    { label: 'Has Everything (20)', value: 'RECIPIENT_PROBLEM' },
    { label: 'Last Minute (20)', value: 'RECIPIENT_URGENCY' },
    { label: 'Occasions (6)', value: 'OCCASION' },
    { label: 'Styles (4)', value: 'STYLE' },
  ];

  const fetchUrls = async (type = selectedType, priority = selectedPriority, search = q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (type) params.set('type', type);
      if (priority) params.set('priority', priority);
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/catalog-urls/?${params.toString()}`);
      const data = await res.json();
      setUrls(data.rows || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch(`/api/admin/catalog-urls/${editing.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      if (!res.ok) {
        setMsg('Failed to update URL');
        return;
      }

      const updated = await res.json();
      setUrls(urls.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
      setMsg('URL updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Error saving URL changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ── Toolbar ────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search by URL, title or ID..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            fetchUrls(selectedType, selectedPriority, e.target.value);
          }}
          style={{
            padding: '9px 14px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            minWidth: '280px',
            fontSize: '0.9rem',
          }}
        />

        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            fetchUrls(e.target.value, selectedPriority, q);
          }}
          style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => {
            setSelectedPriority(e.target.value);
            fetchUrls(selectedType, e.target.value, q);
          }}
          style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
        >
          <option value="">All Priorities</option>
          <option value="P1">P1 (High Demand)</option>
          <option value="P2">P2 (Long Tail)</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.88rem', color: '#64748b' }}>
          Showing <strong>{urls.length}</strong> of {total} catalog URLs
        </span>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
          {msg}
        </div>
      )}

      {/* ── URLs Table ─────────────────────────── */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>ID</th>
                <th>Page Title & Spanish Heading</th>
                <th>URL Path</th>
                <th>Type</th>
                <th>Parent URL</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                      {u.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.page_title}</div>
                    {u.meta_description && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.meta_description}
                      </div>
                    )}
                  </td>
                  <td>
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.88rem' }}
                    >
                      {u.url} ↗
                    </a>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          u.url_type === 'ROOT' || u.url_type === 'SILO'
                            ? '#fef2f2'
                            : u.url_type === 'RECIPIENT'
                            ? '#eff6ff'
                            : u.url_type.startsWith('RECIPIENT_')
                            ? '#f5f3ff'
                            : '#ecfdf5',
                        color:
                          u.url_type === 'ROOT' || u.url_type === 'SILO'
                            ? '#dc2626'
                            : u.url_type === 'RECIPIENT'
                            ? '#1d4ed8'
                            : u.url_type.startsWith('RECIPIENT_')
                            ? '#6d28d9'
                            : '#047857',
                      }}
                    >
                      {u.url_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#64748b' }}>
                    {u.parent_url}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.priority === 'P1' ? '#fee2e2' : '#f1f5f9',
                        color: u.priority === 'P1' ? '#991b1b' : '#475569',
                      }}
                    >
                      {u.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setEditing(u)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        color: '#1e293b',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────── */}
      {editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
              Edit Catalog URL: {editing.id}
            </h2>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Page Title (Spanish)
                </label>
                <input
                  type="text"
                  value={editing.page_title}
                  onChange={(e) => setEditing({ ...editing, page_title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  H1 Heading
                </label>
                <input
                  type="text"
                  value={editing.h1 || editing.page_title}
                  onChange={(e) => setEditing({ ...editing, h1: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={editing.meta_description || ''}
                  onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={editing.priority}
                    onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as 'LIVE' | 'CREATE' | 'REVIEW' })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="CREATE">CREATE</option>
                    <option value="REVIEW">REVIEW</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
