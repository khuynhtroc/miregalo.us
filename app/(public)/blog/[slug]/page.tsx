import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getSettings,
  getCategoryMap,
  getAuthorById,
  getPublishedPost,
  getRelatedPosts,
} from '@/lib/repo';
import { postMetadata, blogPostingSchema, breadcrumbSchema } from '@/lib/seo';
import { postPath } from '@/lib/urls';
import { fmtDate } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TableOfContents } from '@/components/TableOfContents';
import { extractTocItems } from '@/lib/toc';
import { PostCard } from '@/components/PostCard';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost('blog', slug);
  if (!post) return {};
  const settings = await getSettings();
  return postMetadata(settings, post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPost('blog', slug);
  if (!post) notFound();

  const [settings, catMap] = await Promise.all([getSettings(), getCategoryMap()]);
  const primaryCat = post.primary_category_id ? catMap.get(post.primary_category_id) : null;
  const author = await getAuthorById(post.author_id);
  const relatedPosts = await getRelatedPosts(post, 4);
  const tocItems = extractTocItems(post);

  const breadcrumbs = [
    { name: 'Blog', path: '/blog/' },
    ...(primaryCat ? [{ name: primaryCat.name, path: `/${primaryCat.slug}/` }] : []),
    { name: post.title },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          blogPostingSchema(settings, post, author),
        ]}
      />

      <Breadcrumbs crumbs={breadcrumbs} />

      <div className="container article-layout">
        <article className="article-main" data-pagefind-body>
          <header className="article-header">
            {primaryCat && (
              <Link className="eyebrow" href={`/${primaryCat.slug}/`}>
                {primaryCat.name}
              </Link>
            )}
            <h1 data-pagefind-meta="title">{post.title}</h1>
            {post.excerpt && <p className="article-deck">{post.excerpt}</p>}

            <div className="article-byline">
              <span className="author-avatar" aria-hidden="true">
                {author?.name?.charAt(0) || 'L'}
              </span>
              <div>
                <span>
                  Por{' '}
                  {author ? (
                    <Link href={`/author/${author.slug}/`}>{author.name}</Link>
                  ) : (
                    settings.organization_name
                  )}
                </span>
                <span className="article-date" suppressHydrationWarning>
                  <time dateTime={post.published_at || post.created_at} suppressHydrationWarning>
                    {fmtDate(post.published_at || post.created_at)}
                  </time>
                  {post.updated_at && <span suppressHydrationWarning>{` · Actualizado el ${fmtDate(post.updated_at)}`}</span>}
                </span>
              </div>
            </div>

            {post.hero_image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                className="article-hero"
                src={post.hero_image}
                alt={post.hero_alt || post.title}
                loading="eager"
                fetchPriority="high"
                width={800}
                height={450}
                style={{ width: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'cover' }}
              />
            )}
          </header>

          {tocItems.length >= 2 && (
            <TableOfContents
              items={tocItems}
              variant="inline"
              title={`Índice del artículo (${tocItems.length} secciones)`}
            />
          )}

          <div
            className="article-content prose"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          <StoreCta settings={settings} variant="in-article" />
        </article>

        {/* Sticky Aside with Table of Contents */}
        <aside className="article-aside" aria-label="En esta página">
          {tocItems.length >= 2 && (
            <TableOfContents
              items={tocItems}
              variant="aside"
              title="En este artículo"
            />
          )}

          {relatedPosts.length > 0 && (
            <div className="aside-related" style={{ padding: '20px' }}>
              <p
                className="aside-title"
                style={{
                  fontSize: '0.92rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--ink)',
                  fontWeight: 700,
                }}
              >
                <span>💡</span>
                <span>Ideas relacionadas</span>
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', padding: 0 }}>
                {relatedPosts.map((rp) => (
                  <li key={rp.id}>
                    <Link
                      href={postPath(rp)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textDecoration: 'none',
                      }}
                    >
                      {rp.hero_image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={rp.hero_image}
                          alt={rp.hero_alt || rp.title}
                          loading="lazy"
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '8px',
                            background: 'var(--pink-soft)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            fontSize: '1.2rem',
                          }}
                        >
                          📝
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: '#1e293b',
                          }}
                        >
                          {rp.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                          {fmtDate(rp.published_at || rp.created_at)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="section section-wash" data-pagefind-ignore>
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{primaryCat?.name || 'Inspiración'}</p>
                <h2 className="section-title">Más ideas que te encantarán</h2>
              </div>
              {primaryCat && (
                <Link className="section-link" href={`/${primaryCat.slug}/`}>
                  Ver todas <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>

            <div className="article-grid article-grid-four">
              {relatedPosts.map((rp) => (
                <PostCard
                  key={rp.id}
                  post={rp}
                  category={rp.primary_category_id ? catMap.get(rp.primary_category_id) : primaryCat}
                  variant="standard"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <StoreCta settings={settings} />
    </>
  );
}
