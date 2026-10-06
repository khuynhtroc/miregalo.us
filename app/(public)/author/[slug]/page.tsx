import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getSettings,
  getAuthorBySlug,
  getCategoryMap,
  listPublishedPosts,
} from '@/lib/repo';
import { buildMetadata, authorSchema, breadcrumbSchema } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};

  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `${author.name} | ${settings.site_name}`,
    description: author.bio_html.replace(/<[^>]+>/g, '').slice(0, 160) || `Articles by ${author.name}`,
    path: `/author/${author.slug}/`,
    type: 'website',
    image: author.avatar,
  });
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const [settings, catMap] = await Promise.all([getSettings(), getCategoryMap()]);

  const perPage = settings.posts_per_page || 24;
  const { rows: posts, total } = await listPublishedPosts({
    authorId: author.id,
    page: 1,
    perPage,
  });
  const totalPages = Math.ceil(total / perPage);

  const breadcrumbs = [{ name: 'Autores' }, { name: author.name }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          authorSchema(author, author.bio_html.replace(/<[^>]+>/g, '')),
        ]}
      />

      <Breadcrumbs crumbs={breadcrumbs} />

      <section className="author-hero">
        <div className="container author-profile">
          {author.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={author.avatar} alt={author.name} />
          ) : (
            <div className="author-placeholder">{author.name.charAt(0)}</div>
          )}

          <div>
            <p className="eyebrow">{author.job_title || 'Autor'}</p>
            <h1>{author.name}</h1>
            {author.bio_html && (
              <div className="lead" dangerouslySetInnerHTML={{ __html: author.bio_html }} />
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '48px' }}>
        {posts.length > 0 ? (
          <div className="article-grid article-grid-three">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                category={p.primary_category_id ? catMap.get(p.primary_category_id) : null}
                variant="standard"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Aún no hay artículos publicados por este autor</h2>
          </div>
        )}

        <Pagination current={1} total={totalPages} basePath={`/author/${author.slug}`} />
      </div>

      <StoreCta settings={settings} />
    </>
  );
}
