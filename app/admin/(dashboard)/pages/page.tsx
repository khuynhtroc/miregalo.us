import Link from 'next/link';
import { db } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import type { Post } from '@/lib/types';

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function AdminStaticPagesManager({ searchParams }: PageProps) {
  const { q } = await searchParams;

  const res = await db.find('posts', {
    eq: { type: 'page' },
    search: q ? { fields: ['title', 'slug', 'excerpt'], term: q } : undefined,
    order: [{ field: 'title', asc: true }],
  });

  const pages = res.rows as Post[];
  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.length - publishedCount;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 4px', color: '#171a35' }}>
            Static Pages Manager
          </h1>
          <p style={{ margin: 0, color: '#69707d', fontSize: '0.9rem' }}>
            Gestiona las páginas estáticas, legales y de soporte de Miregalo (FAQs, Contacto, Políticas, etc.)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/admin/posts/new/?type=page"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> Nueva Página
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Páginas</span>
          <span className="stat-val">{pages.length}</span>
          <span className="stat-desc">Páginas institucionales e informativas</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Páginas Publicadas</span>
          <span className="stat-val" style={{ color: '#059669' }}>{publishedCount}</span>
          <span className="stat-desc">Visibles para los usuarios y motores de búsqueda</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Borradores</span>
          <span className="stat-val" style={{ color: '#d97706' }}>{draftCount}</span>
          <span className="stat-desc">En edición interna</span>
        </div>
      </div>

      {/* Search Bar */}
      <form
        method="GET"
        className="admin-card"
        style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}
      >
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <input
          type="text"
          name="q"
          defaultValue={q || ''}
          placeholder="Buscar páginas por título o slug..."
          className="form-input"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        />
        <button type="submit" className="btn-secondary" style={{ padding: '8px 16px' }}>
          Buscar
        </button>
        {q && (
          <Link href="/admin/pages/" className="btn-secondary" style={{ padding: '8px 12px' }}>
            Limpiar
          </Link>
        )}
      </form>

      {/* Pages Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Página / Título</th>
                <th>Ruta / URL</th>
                <th>Estado</th>
                <th>Última Actualización</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#69707d' }}>
                    No se encontraron páginas estáticas. Haz clic en "Nueva Página" para crear una.
                  </td>
                </tr>
              ) : (
                pages.map((p) => {
                  const liveUrl = `/${p.slug}/`;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#171a35', fontSize: '0.96rem' }}>
                          <Link href={`/admin/posts/${p.id}/`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {p.title}
                          </Link>
                        </div>
                        {p.excerpt && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#69707d',
                              marginTop: '3px',
                              maxWidth: '480px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.excerpt}
                          </div>
                        )}
                      </td>
                      <td>
                        <code
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.84rem',
                          }}
                        >
                          {liveUrl}
                        </code>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'published' ? 'badge-green' : 'badge-yellow'
                          }`}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {p.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: '#69707d' }}>
                        {fmtDate(p.updated_at || p.published_at || p.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '6px 10px', textDecoration: 'none' }}
                          >
                            Ver en Vivo ↗
                          </Link>
                          <Link
                            href={`/admin/posts/${p.id}/`}
                            className="btn-primary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none' }}
                          >
                            Editar ✏️
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
