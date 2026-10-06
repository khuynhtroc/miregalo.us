import Link from 'next/link';

interface PaginationProps {
  current: number;
  total: number;
  basePath: string; // e.g. "/women"
}

export function Pagination({ current, total, basePath }: PaginationProps) {
  if (total <= 1) return null;

  const cleanBase = basePath.replace(/\/$/, '');
  const urlFor = (p: number) => (p === 1 ? `${cleanBase}/` : `${cleanBase}/page/${p}/`);

  // Build page numbers with ellipses
  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <nav className="pagination" aria-label="Paginación">
      {current > 1 ? (
        <Link className="page-link page-direction" href={urlFor(current - 1)}>
          ← Anterior
        </Link>
      ) : (
        <span className="page-link page-direction is-disabled">← Anterior</span>
      )}

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="page-gap">
            …
          </span>
        ) : p === current ? (
          <span key={p} className="page-link is-current" aria-current="page">
            {p}
          </span>
        ) : (
          <Link key={p} className="page-link" href={urlFor(p)}>
            {p}
          </Link>
        )
      )}

      {current < total ? (
        <Link className="page-link page-direction" href={urlFor(current + 1)}>
          Siguiente →
        </Link>
      ) : (
        <span className="page-link page-direction is-disabled">Siguiente →</span>
      )}
    </nav>
  );
}
