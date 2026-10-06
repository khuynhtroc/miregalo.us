import type { Post, Category, Author, SiteSettings } from '@/lib/types';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Hub slugs and the group they aggregate. Spanish primary hubs with backward aliases. */
export const HUBS: Record<string, { group: Category['group'] | 'all-gifts' | 'all-blog'; label: string }> = {
  regalos: { group: 'all-gifts', label: 'Catálogo de Regalos' },
  destinatarios: { group: 'recipients', label: 'Destinatarios' },
  ocasiones: { group: 'occasions', label: 'Ocasiones' },
  intereses: { group: 'interests', label: 'Intereses' },
  blog: { group: 'all-blog', label: 'Blog' },
  gifts: { group: 'all-gifts', label: 'Guías de Regalos' },
  recipients: { group: 'recipients', label: 'Destinatarios' },
  occasions: { group: 'occasions', label: 'Ocasiones' },
  interests: { group: 'interests', label: 'Intereses' },
};

export const GROUP_HUB: Record<string, string> = {
  recipients: 'destinatarios',
  occasions: 'ocasiones',
  interests: 'intereses',
  blog: 'blog',
};

export const RESERVED_ROOT_SLUGS = new Set([
  'admin', 'api', 'author', 'search', 'go', 'page', 'regalos', 'blog', 'rss.xml', 'robots.txt', 'sitemap-index.xml', 'sitemap.xml', 'sitemap-0.xml', '_next',
]);

/** URL patterns (all trailing slash):
 *  /                       home
 *  /{gift-slug}/           gift guide
 *  /blog/{slug}/           blog post
 *  /{page-slug}/           static page (about-us…)
 *  /{category}/            taxonomy or hub   (+ /page/{n}/)
 *  /author/{slug}/         author archive    (+ /page/{n}/)
 *  /search/?q=             search
 */
export function postPath(p: Pick<Post, 'type' | 'slug'>): string {
  return p.type === 'blog' ? `/blog/${p.slug}/` : `/${p.slug}/`;
}
export function categoryPath(c: Pick<Category, 'slug'>, page = 1): string {
  return page > 1 ? `/${c.slug}/page/${page}/` : `/${c.slug}/`;
}
export function authorPath(a: Pick<Author, 'slug'>, page = 1): string {
  return page > 1 ? `/author/${a.slug}/page/${page}/` : `/author/${a.slug}/`;
}
export function absUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL + (path.startsWith('/') ? path : '/' + path);
}

export function pageTitle(title: string, s: Pick<SiteSettings, 'site_name' | 'title_separator'>): string {
  return `${title} ${s.title_separator || '|'} ${s.site_name}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}
