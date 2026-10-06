'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';
import Link from 'next/link';

interface CategoryManagerProps {
  initialCategories: Category[];
  counts: Record<string, number>;
}

export function CategoryManager({ initialCategories, counts }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const groups: Category['group'][] = ['hub', 'recipients', 'occasions', 'interests', 'blog'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch(`/api/admin/categories/${editing.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      if (!res.ok) {
        setMsg('Failed to update category');
        setLoading(false);
        return;
      }

      const updated = await res.json();
      setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
      setEditing(null);
      setMsg('Category updated successfully');
      setLoading(false);
    } catch {
      setMsg('Error saving category');
      setLoading(false);
    }
  };

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 14px', background: '#e6f7ed', borderRadius: '8px', color: '#027a48', marginBottom: '16px' }}>
          {msg}
        </div>
      )}

      {/* Edit Modal/Form if active */}
      {editing && (
        <div className="admin-card" style={{ border: '2px solid #3349b5', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 className="admin-card-title">Edit Category: {editing.name}</h2>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
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
                <label className="form-label">Group</label>
                <select
                  className="form-select"
                  value={editing.group}
                  onChange={(e) => setEditing({ ...editing, group: e.target.value as Category['group'] })}
                >
                  <option value="hub">Hub</option>
                  <option value="recipients">Recipients</option>
                  <option value="occasions">Occasions</option>
                  <option value="interests">Interests</option>
                  <option value="blog">Blog</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Eyebrow</label>
                <input
                  className="form-input"
                  type="text"
                  value={editing.eyebrow}
                  onChange={(e) => setEditing({ ...editing, eyebrow: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Intro</label>
              <input
                className="form-input"
                type="text"
                value={editing.short_intro}
                onChange={(e) => setEditing({ ...editing, short_intro: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description HTML</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '80px' }}
                value={editing.description_html}
                onChange={(e) => setEditing({ ...editing, description_html: e.target.value })}
              />
            </div>

            <div className="form-row" style={{ alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  className="form-input"
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={editing.show_in_nav}
                    onChange={(e) => setEditing({ ...editing, show_in_nav: e.target.checked })}
                  />
                  Show in Nav Mega Menu
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={editing.show_in_footer}
                    onChange={(e) => setEditing({ ...editing, show_in_footer: e.target.checked })}
                  />
                  Show in Footer
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    checked={editing.quick_link}
                    onChange={(e) => setEditing({ ...editing, quick_link: e.target.checked })}
                  />
                  Popular Quick Link (Hero Pill)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tables grouped by Section */}
      {groups.map((grp) => {
        const list = categories.filter((c) => c.group === grp);
        if (list.length === 0) return null;

        return (
          <div key={grp} className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '14px 20px', background: '#f8f9fc', borderBottom: '1px solid #e6e7ec' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#171a35', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {grp === 'hub' ? 'Landing Hubs' : `${grp.charAt(0).toUpperCase() + grp.slice(1)} Taxonomies`} ({list.length})
              </h3>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>URL Path</th>
                  <th>Eyebrow</th>
                  <th>Articles</th>
                  <th>Nav / Footer</th>
                  <th>Hero Pill</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: '#171a35' }}>{c.name}</strong>
                    </td>
                    <td>
                      <code>/{c.slug}/</code>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#69707d' }}>{c.eyebrow || '—'}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: '#f2f4f7',
                          color: '#344054',
                          borderRadius: '999px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                        }}
                      >
                        {counts[c.id] || 0} articles
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {c.show_in_nav && 'Nav '}
                      {c.show_in_footer && '• Footer'}
                    </td>
                    <td>{c.quick_link ? '⭐ Yes' : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => setEditing(c)}
                        >
                          Edit
                        </button>
                        <Link
                          href={`/${c.slug}/`}
                          target="_blank"
                          style={{ fontSize: '0.78rem', color: '#3349b5', alignSelf: 'center' }}
                        >
                          View ↗
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
