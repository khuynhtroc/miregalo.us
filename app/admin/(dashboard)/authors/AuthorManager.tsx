'use client';

import { useState } from 'react';
import type { Author } from '@/lib/types';

interface AuthorManagerProps {
  initialAuthors: Author[];
}

export function AuthorManager({ initialAuthors }: AuthorManagerProps) {
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [editing, setEditing] = useState<Author | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin/authors/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      if (!res.ok) {
        setMsg('Failed to update author');
        setLoading(false);
        return;
      }

      const updated = await res.json();
      setAuthors(authors.map((a) => (a.id === updated.id ? updated : a)));
      setEditing(null);
      setMsg('Author profile updated successfully');
      setLoading(false);
    } catch {
      setMsg('Error saving author');
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px', color: '#171a35' }}>
          Editorial Authors
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.88rem' }}>
          Manage author profiles, bylines, bios, and Person/Organization schema markup.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', background: '#e6f7ed', borderRadius: '8px', color: '#027a48', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      {editing && (
        <div className="admin-card" style={{ border: '2px solid #3349b5', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 className="admin-card-title">Edit Author: {editing.name}</h2>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Author Name *</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Schema Type</label>
                <select
                  className="form-select"
                  value={editing.entity_type}
                  onChange={(e) => setEditing({ ...editing, entity_type: e.target.value as 'Organization' | 'Person' })}
                >
                  <option value="Organization">Organization (Team)</option>
                  <option value="Person">Person (Individual)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  className="form-input"
                  type="text"
                  value={editing.job_title}
                  onChange={(e) => setEditing({ ...editing, job_title: e.target.value })}
                  placeholder="e.g. Lead Gift Curator"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Image URL</label>
                <input
                  className="form-input"
                  type="text"
                  value={editing.avatar}
                  onChange={(e) => setEditing({ ...editing, avatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio HTML</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '90px' }}
                value={editing.bio_html}
                onChange={(e) => setEditing({ ...editing, bio_html: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Author'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Profile URL</th>
              <th>Schema Type</th>
              <th>Job Title</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong style={{ color: '#171a35' }}>{a.name}</strong>
                  {a.email && <div style={{ fontSize: '0.75rem', color: '#8c93a4' }}>{a.email}</div>}
                </td>
                <td>
                  <code>/author/{a.slug}/</code>
                </td>
                <td>
                  <span className="badge badge-published">{a.entity_type}</span>
                </td>
                <td style={{ fontSize: '0.84rem' }}>{a.job_title || '—'}</td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    onClick={() => setEditing(a)}
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
  );
}
