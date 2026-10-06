'use client';

import { useState } from 'react';
import type { Redirect } from '@/lib/types';

interface RedirectManagerProps {
  initialRedirects: Redirect[];
}

export function RedirectManager({ initialRedirects }: RedirectManagerProps) {
  const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [code, setCode] = useState<Redirect['code']>(301);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination) return;
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin/redirects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination, code }),
      });

      if (!res.ok) {
        setMsg('Failed to add redirect');
        setLoading(false);
        return;
      }

      const created = await res.json();
      setRedirects([created, ...redirects]);
      setSource('');
      setDestination('');
      setMsg('Redirect rule added successfully');
      setLoading(false);
    } catch {
      setMsg('Error adding redirect');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/redirects/?id=${id}`, { method: 'DELETE' });
      setRedirects(redirects.filter((r) => r.id !== id));
      setMsg('Redirect removed');
    } catch {
      setMsg('Error deleting redirect');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px', color: '#171a35' }}>
          URL Redirects (301/302)
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.88rem' }}>
          Create 301 permanent or 302 temporary redirects for old slugs or renamed guides.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', background: '#e6f7ed', borderRadius: '8px', color: '#027a48', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      {/* Add New Redirect Rule Form */}
      <div className="admin-card">
        <h2 className="admin-card-title" style={{ marginBottom: '16px' }}>
          + Add New Redirect Rule
        </h2>
        <form onSubmit={handleAdd} className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Source Path (Old URL)</label>
            <input
              className="form-input"
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="/old-gift-guide/"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Destination URL / Path</label>
            <input
              className="form-input"
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="/new-gift-guide/ or https://..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, maxWidth: '140px' }}>
            <label className="form-label">Status Code</label>
            <select
              className="form-select"
              value={code}
              onChange={(e) => setCode(parseInt(e.target.value, 10) as Redirect['code'])}
            >
              <option value="301">301 (Permanent)</option>
              <option value="302">302 (Found)</option>
              <option value="308">308 (Permanent)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ height: '42px' }}>
            {loading ? 'Adding...' : 'Add Rule'}
          </button>
        </form>
      </div>

      {/* Redirects Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Code</th>
              <th>Hits</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id}>
                <td>
                  <code>{r.source}</code>
                </td>
                <td>
                  <code>{r.destination}</code>
                </td>
                <td>
                  <span className="badge badge-published">{r.code}</span>
                </td>
                <td>{r.hits || 0}</td>
                <td>
                  <button
                    type="button"
                    className="btn-danger"
                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                    onClick={() => handleDelete(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
