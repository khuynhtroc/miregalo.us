import Link from 'next/link';

export interface Crumb {
  name: string;
  path?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  if (!crumbs || crumbs.length === 0) return null;

  return (
    <div className="container breadcrumbs">
      <Link href="/">Inicio</Link>
      {crumbs.map((crumb, idx) => (
        <span key={idx} style={{ display: 'contents' }}>
          <span aria-hidden="true">/</span>
          {crumb.path && idx < crumbs.length - 1 ? (
            <Link href={crumb.path}>{crumb.name}</Link>
          ) : (
            <span>{crumb.name}</span>
          )}
        </span>
      ))}
    </div>
  );
}
