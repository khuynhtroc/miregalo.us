import type { Metadata } from 'next';
import type { Post, Category, Author, SiteSettings, FaqItem } from '@/lib/types';
import { absUrl, pageTitle, postPath, SITE_URL } from '@/lib/urls';
import { stripHtml } from '@/lib/format';

/* ───────────────────────── <head> metadata ───────────────────────── */

interface MetaInput {
  title: string; // already the full <title>
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  robots?: string;
  canonical?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

function parseRobots(r: string, siteNoindex: boolean): Metadata['robots'] {
  const s = (siteNoindex ? 'noindex, nofollow' : r || 'index, follow, max-image-preview:large').toLowerCase();
  return {
    index: !s.includes('noindex'),
    follow: !s.includes('nofollow'),
    ...(s.includes('max-image-preview:large') ? { 'max-image-preview': 'large' as const } : {}),
  };
}

export function buildMetadata(s: SiteSettings, m: MetaInput): Metadata {
  const url = absUrl(m.path);
  const canonical = m.canonical ? absUrl(m.canonical) : url;
  const image = m.image || s.default_og_image || undefined;
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: {
      canonical,
      types: { 'application/rss+xml': [{ url: absUrl('/rss.xml'), title: `${s.site_name} RSS` }] },
    },
    robots: parseRobots(m.robots || '', s.noindex_site),
    openGraph: {
      type: m.type ?? 'website',
      title: m.title,
      description: m.description,
      url: canonical,
      siteName: s.site_name,
      locale: s.locale,
      ...(image ? { images: [{ url: absUrl(image) }] } : {}),
      ...(m.type === 'article'
        ? { publishedTime: m.publishedTime ?? undefined, modifiedTime: m.modifiedTime ?? undefined }
        : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: m.title,
      description: m.description,
      ...(image ? { images: [absUrl(image)] } : {}),
    },
  };
}

export function postMetadata(s: SiteSettings, p: Post): Metadata {
  return buildMetadata(s, {
    title: p.seo_title || pageTitle(p.title, s),
    description: p.seo_description || p.excerpt || stripHtml(p.intro_html || p.content_html).slice(0, 160),
    path: postPath(p),
    type: p.type === 'page' ? 'website' : 'article',
    image: p.og_image || p.hero_image,
    robots: p.robots,
    canonical: p.canonical_url,
    publishedTime: p.published_at,
    modifiedTime: p.updated_at,
  });
}

/* ───────────────────────── JSON-LD schema ───────────────────────── */

export function orgSchema(s: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: s.organization_name,
    url: s.organization_url,
    logo: absUrl(s.logo_fullsize_url || s.logo_url),
  };
}

export function websiteSchema(s: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: s.site_name,
    url: SITE_URL,
    inLanguage: s.locale || 'es',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function blogPostingSchema(s: SiteSettings, p: Post, author: Author | null) {
  const url = absUrl(postPath(p));
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.seo_description || p.excerpt,
    url,
    mainEntityOfPage: url,
    inLanguage: s.locale || 'es',
    ...(p.hero_image ? { image: [absUrl(p.hero_image)] } : {}),
    datePublished: p.published_at,
    dateModified: p.updated_at,
    ...(author
      ? {
          author: {
            '@type': author.entity_type,
            name: author.name,
            url: absUrl(`/author/${author.slug}/`),
          },
        }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: s.organization_name,
      url: s.organization_url,
      logo: absUrl(s.logo_fullsize_url || s.logo_url),
    },
  };
}

export function itemListOfProducts(p: Post) {
  const items = (p.items ?? []).filter((i) => i.heading);
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: p.title,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.heading,
      url: `${absUrl(postPath(p))}#item-${i + 1}`,
    })),
  };
}

export function faqSchema(faqs: FaqItem[]) {
  const list = (faqs ?? []).filter((f) => f.q && f.a);
  if (!list.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; path?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absUrl(c.path) } : {}),
    })),
  };
}

export function collectionSchema(name: string, description: string, path: string, posts: Post[], total: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: posts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absUrl(postPath(p)),
        name: p.title,
      })),
    },
  };
}

export function authorSchema(a: Author, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': a.entity_type,
    name: a.name,
    description,
    url: absUrl(`/author/${a.slug}/`),
    ...(a.email ? { email: a.email } : {}),
    ...(a.avatar ? { image: absUrl(a.avatar) } : {}),
    ...(a.job_title && a.entity_type === 'Person' ? { jobTitle: a.job_title } : {}),
    ...(a.same_as?.length ? { sameAs: a.same_as } : {}),
  };
}

export function categoryDescription(c: Category, s: SiteSettings) {
  return c.seo_description || stripHtml(c.description_html).slice(0, 160) || `Gift ideas and inspiration from ${s.site_name}.`;
}
