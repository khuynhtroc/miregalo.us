import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSettings, getCategoryMap, listPublishedPosts } from '@/lib/repo';
import { buildMetadata, collectionSchema, breadcrumbSchema } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';

interface PageProps {
  params: Promise<{ page: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page: pageStr } = await params;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) return {};

  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `Blog - Página ${page} | ${settings.site_name}`,
    description: 'Consejos de relaciones, frases emotivas, tradiciones e inspiración para momentos significativos.',
    path: `/blog/page/${page}/`,
    type: 'website',
  });
}

export default async function BlogPaginationPage({ params }: PageProps) {
  const { page: pageStr } = await params;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  const [settings, catMap] = await Promise.all([getSettings(), getCategoryMap()]);

  const perPage = settings.posts_per_page || 24;
  const { rows: posts, total } = await listPublishedPosts({
    type: 'blog',
    page,
    perPage,
  });
  const totalPages = Math.ceil(total / perPage);

  if (page > totalPages && totalPages > 0) notFound();

  const breadcrumbs = [{ name: 'Blog', path: '/blog/' }, { name: `Página ${page}` }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          collectionSchema(
            `Blog - Página ${page}`,
            'Historias, reflexiones e ideas para momentos significativos.',
            `/blog/page/${page}/`,
            posts,
            total
          ),
        ]}
      />

      <Breadcrumbs crumbs={breadcrumbs} />

      <section className="collection-hero">
        <div className="container collection-hero-inner">
          <div>
            <p className="eyebrow">Historias e inspiración</p>
            <h1>Blog</h1>
            <p className="collection-description">Página {page} de {totalPages}</p>
          </div>
          <div className="collection-count">
            <strong>{total}</strong>
            <span>artículos</span>
          </div>
        </div>
      </section>

      <div className="container">
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

        <Pagination current={page} total={totalPages} basePath="/blog" />
      </div>

      <StoreCta settings={settings} />
    </>
  );
}
