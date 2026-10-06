import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getSettings,
  getCategoryMap,
  getAuthorById,
  getPublishedPost,
  listPublishedPosts,
} from '@/lib/repo';
import { postMetadata, blogPostingSchema, breadcrumbSchema } from '@/lib/seo';
import { postPath } from '@/lib/urls';
import { fmtDate } from '@/lib/format';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TableOfContents } from '@/components/TableOfContents';
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

  const { rows: relatedPosts } = await listPublishedPosts({
    type: 'blog',
    categoryId: post.primary_category_id || undefined,
    excludeId: post.id,
    perPage: 4,
  });

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
                <span className="article-date">
                  <time dateTime={post.published_at || post.created_at}>
                    {fmtDate(post.published_at || post.created_at)}
                  </time>
                  {post.updated_at && ` · Actualizado el ${fmtDate(post.updated_at)}`}
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
              />
            )}
          </header>

          <div
            className="article-content prose"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          <StoreCta settings={settings} variant="in-article" />
        </article>

        {/* Sticky Aside with Table of Contents */}
        <aside className="article-aside" aria-label="En esta página">
          <TableOfContents />

          {relatedPosts.length > 0 && (
            <div className="aside-related">
              <p className="aside-title">Ideas relacionadas</p>
              <ul>
                {relatedPosts.map((rp) => (
                  <li key={rp.id}>
                    <Link href={postPath(rp)}>{rp.title}</Link>
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
                  category={primaryCat}
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
