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
  params: Promise<{ slug: string; page: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, page: pageStr } = await params;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) return {};

  const author = await getAuthorBySlug(slug);
  if (!author) return {};

  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `${author.name} - Página ${page} | ${settings.site_name}`,
    description: `Página ${page} de artículos por ${author.name}`,
    path: `/author/${author.slug}/page/${page}/`,
    type: 'website',
  });
}

export default async function AuthorPaginationPage({ params }: PageProps) {
  const { slug, page: pageStr } = await params;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const [settings, catMap] = await Promise.all([getSettings(), getCategoryMap()]);

  const perPage = settings.posts_per_page || 24;
  const { rows: posts, total } = await listPublishedPosts({
    authorId: author.id,
    page,
    perPage,
  });
  const totalPages = Math.ceil(total / perPage);

  if (page > totalPages && totalPages > 0) notFound();

  const breadcrumbs = [
    { name: 'Autores' },
    { name: author.name, path: `/author/${author.slug}/` },
    { name: `Página ${page}` },
  ];

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
            <p className="lead">Página {page} de {totalPages}</p>
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
            <h2>No se encontraron artículos</h2>
          </div>
        )}

        <Pagination current={page} total={totalPages} basePath={`/author/${author.slug}`} />
      </div>

      <StoreCta settings={settings} />
    </>
  );
}
