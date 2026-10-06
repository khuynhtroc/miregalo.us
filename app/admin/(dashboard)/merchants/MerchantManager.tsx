'use client';

import { useState } from 'react';
import type { Merchant } from '@/lib/types';
import { slugify } from '@/lib/urls';

interface MerchantManagerProps {
  initialMerchants: Merchant[];
}

export function MerchantManager({ initialMerchants }: MerchantManagerProps) {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants);
  const [editing, setEditing] = useState<Partial<Merchant> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [importing, setImporting] = useState(false);

  const handleStartNew = () => {
    setIsNew(true);
    setEditing({
      name: '',
      slug: '',
      website_url: '',
      affiliate_network: 'Amazon Associates',
      affiliate_param: '',
      commission_rate: '5%',
      logo_url: '',
      notes: '',
      active: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMsg('');

    try {
      const url = isNew ? '/api/admin/merchants/' : `/api/admin/merchants/${editing.id}/`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      if (!res.ok) {
        setMsg('Failed to save merchant');
        setLoading(false);
        return;
      }

      const saved = await res.json();
      if (isNew) {
        setMerchants([saved, ...merchants]);
      } else {
        setMerchants(merchants.map((m) => (m.id === saved.id ? saved : m)));
      }

      setEditing(null);
      setIsNew(false);
      setMsg('Merchant saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Error saving merchant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        setMerchants(merchants.filter((m) => m.id !== id));
        setMsg('Merchant deleted');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      setMsg('Error deleting merchant');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'merchants');

    try {
      const res = await fetch('/api/admin/import-csv/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Successfully imported ${data.importedCount} merchants!`);
        // Refresh merchants list
        const mRes = await fetch('/api/admin/merchants/');
        const mData = await mRes.json();
        setMerchants(mData.rows || []);
      } else {
        setMsg(data.error || 'Failed to import CSV');
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error importing CSV');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      {/* ── Toolbar ────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleStartNew} className="btn-primary" style={{ padding: '9px 16px', fontSize: '0.9rem' }}>
            + Add New Merchant
          </button>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#334155',
            }}
          >
            <span>📥 {importing ? 'Importing CSV...' : 'Import CSV'}</span>
            <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} disabled={importing} />
          </label>
        </div>

        <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Total: <strong>{merchants.length} Active Merchants &amp; Networks</strong>
        </span>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
          {msg}
        </div>
      )}

      {/* ── Merchants Cards Grid ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {merchants.map((m) => (
          <div
            key={m.id}
            className="admin-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderRadius: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                  {m.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                  ID: {m.id} • Slug: {m.slug}
                </span>
              </div>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: m.active ? '#dcfce7' : '#fee2e2',
                  color: m.active ? '#15803d' : '#991b1b',
                }}
              >
                {m.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: '#334155', marginBottom: '18px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Network:</span>{' '}
                <strong style={{ color: '#0284c7' }}>{m.affiliate_network || 'Direct'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Commission:</span>{' '}
                <strong>{m.commission_rate || 'N/A'}</strong>
              </div>
              {m.affiliate_param && (
                <div>
                  <span style={{ color: '#64748b' }}>Tracking Param:</span>{' '}
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {m.affiliate_param}
                  </code>
                </div>
              )}
              <div>
                <span style={{ color: '#64748b' }}>Website:</span>{' '}
                <a href={m.website_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'none' }}>
                  {m.website_url} ↗
                </a>
              </div>
              {m.notes && (
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                  {m.notes}
                </p>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <button
                onClick={() => {
                  setIsNew(false);
                  setEditing(m);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: '#fff',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit / Create Modal ────────────────── */}
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
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 20px', color: '#0f172a' }}>
              {isNew ? 'Add New Merchant' : `Edit Merchant: ${editing.name}`}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={editing.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditing({
                      ...editing,
                      name,
                      slug: isNew ? slugify(name) : editing.slug,
                    });
                  }}
                  required
                  placeholder="e.g. Amazon España"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editing.slug || ''}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Affiliate Network
                  </label>
                  <select
                    value={editing.affiliate_network || 'Direct'}
                    onChange={(e) => setEditing({ ...editing, affiliate_network: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Amazon Associates">Amazon Associates</option>
                    <option value="Awin">Awin</option>
                    <option value="CJ Affiliate">CJ Affiliate</option>
                    <option value="Rakuten">Rakuten</option>
                    <option value="Direct">Direct Merchant</option>
                    <option value="In-House Direct">In-House Direct</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Website / Store Base URL
                </label>
                <input
                  type="url"
                  value={editing.website_url || ''}
                  onChange={(e) => setEditing({ ...editing, website_url: e.target.value })}
                  required
                  placeholder="https://www.amazon.es"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Tracking Param (e.g. tag=xxx)
                  </label>
                  <input
                    type="text"
                    value={editing.affiliate_param || ''}
                    onChange={(e) => setEditing({ ...editing, affiliate_param: e.target.value })}
                    placeholder="tag=giftblog-21"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Commission Rate
                  </label>
                  <input
                    type="text"
                    value={editing.commission_rate || ''}
                    onChange={(e) => setEditing({ ...editing, commission_rate: e.target.value })}
                    placeholder="3% - 10%"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
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
                  {loading ? 'Saving...' : 'Save Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
