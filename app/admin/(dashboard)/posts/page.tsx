import Link from 'next/link';
import { db } from '@/lib/db';
import { getCategories } from '@/lib/repo';
import { fmtDate } from '@/lib/format';
import { postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';

interface PageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    category?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const { type, status, category, sort = 'recent', q, page = '1' } = await searchParams;

  const pageSize = 50;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * pageSize;

  const categories = await getCategories();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Build filter query
  const eqFilter: Record<string, any> = {};
  if (type) eqFilter.type = type;
  if (status) eqFilter.status = status;
  if (category) eqFilter.primary_category_id = category;

  let orderField: string = 'created_at';
  let orderAsc: boolean = false;

  if (sort === 'oldest') {
    orderField = 'created_at';
    orderAsc = true;
  } else if (sort === 'title') {
    orderField = 'title';
    orderAsc = true;
  }

  const postsRes = await db.find('posts', {
    eq: Object.keys(eqFilter).length > 0 ? eqFilter : undefined,
    search: q ? { fields: ['title', 'slug', 'excerpt', 'focus_keyword'], term: q } : undefined,
    order: [{ field: orderField, asc: orderAsc }],
    limit: pageSize,
    offset,
  });

  const totalPosts = postsRes.total;
  const totalPages = Math.ceil(totalPosts / pageSize);

  // Compute metrics from current page
  const giftPostsCount = postsRes.rows.filter((p) => p.type === 'gift').length;
  const publishedCount = postsRes.rows.filter((p) => p.status === 'published').length;
  const totalItemsRendered = postsRes.rows.reduce((sum, p) => sum + (p.items?.length || 0), 0);

  return (
    <div>
      {/* Title & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 4px', color: '#171a35' }}>
            Posts &amp; Gift Guides Manager
          </h1>
          <p style={{ margin: 0, color: '#69707d', fontSize: '0.9rem' }}>
            {totalPosts} total Spanish articles &amp; gift guides • Page {currentPage} of {Math.max(1, totalPages)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/generator/" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span> AI Generator Studio
          </Link>
          <Link href="/admin/posts/new/" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>+</span> Create New Post
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Articles</span>
          <span className="stat-val">{totalPosts}</span>
          <span className="stat-desc">Spanish localized guides</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Published Guides</span>
          <span className="stat-val" style={{ color: '#059669' }}>{publishedCount} on page</span>
          <span className="stat-desc">Live on canonical URLs</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gift Guides (Picks)</span>
          <span className="stat-val">{giftPostsCount} on page</span>
          <span className="stat-desc">Product cards enabled</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Product Items</span>
          <span className="stat-val" style={{ color: '#4f46e5' }}>{totalItemsRendered}</span>
          <span className="stat-desc">Tracked across page items</span>
        </div>
      </div>

      {/* Comprehensive Filters Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form method="get" className="admin-search-bar" style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input
            name="q"
            defaultValue={q || ''}
            className="form-input"
            placeholder="Search by title, keyword, or slug..."
            style={{ minWidth: '260px', flex: 1 }}
          />

          <select name="type" defaultValue={type || ''} className="form-select" style={{ maxWidth: '150px' }}>
            <option value="">All Types</option>
            <option value="gift">Gift Guides</option>
            <option value="blog">Blog Posts</option>
            <option value="page">Static Pages</option>
          </select>

          <select name="status" defaultValue={status || ''} className="form-select" style={{ maxWidth: '150px' }}>
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
          </select>

          <select name="category" defaultValue={category || ''} className="form-select" style={{ maxWidth: '170px' }}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select name="sort" defaultValue={sort} className="form-select" style={{ maxWidth: '150px' }}>
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>

          <button type="submit" className="btn-secondary">
            Filter
          </button>

          {(q || type || status || category || sort !== 'recent') && (
            <Link href="/admin/posts/" className="btn-secondary" style={{ color: '#69707d' }}>
              Reset Filters
            </Link>
          )}
        </form>
      </div>

      {/* Posts Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title &amp; Canonical Slug</th>
              <th>Type</th>
              <th>Category</th>
              <th>Status</th>
              <th>Items &amp; FAQs</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {postsRes.rows.map((post) => {
              const primaryCat = post.primary_category_id ? catMap.get(post.primary_category_id) : null;
              return (
                <tr key={post.id}>
                  <td>
                    <Link
                      href={`/admin/posts/${post.id}/`}
                      style={{ fontWeight: 600, color: '#171a35', textDecoration: 'none' }}
                    >
                      {post.title}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: '#8c93a4', marginTop: '2px' }}>
                      <code>/{post.slug}/</code>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${post.type}`}>{post.type}</span>
                  </td>
                  <td>
                    {primaryCat ? (
                      <span style={{ fontSize: '0.84rem' }}>{primaryCat.name}</span>
                    ) : (
                      <span style={{ color: '#8c93a4' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${post.status}`}>{post.status}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>🛍️ {post.items?.length || 0} items</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>❓ {post.faqs?.length || 0} FAQs</div>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#69707d' }}>
                    {fmtDate(post.published_at || post.created_at)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/admin/posts/${post.id}/`}
                        style={{ fontSize: '0.82rem', color: '#3349b5', fontWeight: 600 }}
                      >
                        Edit
                      </Link>
                      {post.status === 'published' && (
                        <Link
                          href={postPath(post as Post)}
                          target="_blank"
                          style={{ fontSize: '0.82rem', color: '#69707d' }}
                        >
                          View ↗
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
          {currentPage > 1 && (
            <Link
              href={`/admin/posts/?page=${currentPage - 1}${q ? `&q=${q}` : ''}${type ? `&type=${type}` : ''}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}&sort=${sort}`}
              className="btn-secondary"
            >
              ← Previous
            </Link>
          )}

          <span style={{ fontSize: '0.88rem', color: '#64748b', padding: '0 10px' }}>
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages && (
            <Link
              href={`/admin/posts/?page=${currentPage + 1}${q ? `&q=${q}` : ''}${type ? `&type=${type}` : ''}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}&sort=${sort}`}
              className="btn-secondary"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
