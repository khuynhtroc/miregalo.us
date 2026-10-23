import Link from 'next/link';

export interface Crumb {
  name: string;
  path?: string;
  url?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  if (!crumbs || crumbs.length === 0) return null;

  // Filter out duplicate root "Inicio" crumb if already passed in crumbs array
  const displayCrumbs =
    crumbs[0]?.path === '/' ||
    (crumbs[0] as any)?.url === '/' ||
    crumbs[0]?.name?.toLowerCase() === 'inicio'
      ? crumbs.slice(1)
      : crumbs;

  return (
    <div className="container breadcrumbs">
      <Link href="/">Inicio</Link>
      {displayCrumbs.map((crumb, idx) => {
        const targetPath = crumb.path || crumb.url;
        return (
          <span key={idx} style={{ display: 'contents' }}>
            <span aria-hidden="true">/</span>
            {targetPath && idx < displayCrumbs.length - 1 ? (
              <Link href={targetPath}>{crumb.name}</Link>
            ) : (
              <span>{crumb.name}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
