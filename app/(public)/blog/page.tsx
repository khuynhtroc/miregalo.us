import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings, getCategories, getCategoryMap, listPublishedPosts } from '@/lib/repo';
import { buildMetadata, collectionSchema, breadcrumbSchema } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `Blog | ${settings.site_name}`,
    description: 'Consejos de relaciones, frases emotivas, tradiciones e inspiración para momentos significativos.',
    path: '/blog/',
    type: 'website',
  });
}

export default async function BlogIndexPage() {
  const [settings, categories, catMap] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryMap(),
  ]);

  const perPage = settings.posts_per_page || 24;
  const { rows: posts, total } = await listPublishedPosts({
    type: 'blog',
    page: 1,
    perPage,
  });
  const totalPages = Math.ceil(total / perPage);

  const blogCategories = categories.filter((c) => c.group === 'blog');
  const breadcrumbs = [{ name: 'Blog' }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          collectionSchema('Blog', 'Historias, reflexiones e ideas para momentos significativos.', '/blog/', posts, total),
        ]}
      />

      <Breadcrumbs crumbs={breadcrumbs} />

      <section className="collection-hero">
        <div className="container collection-hero-inner">
          <div>
            <p className="eyebrow">Historias e inspiración</p>
            <h1>Blog</h1>
            <p className="collection-description">
              Consejos de relaciones, citas emotivas, inspiración festiva e ideas para momentos significativos.
            </p>
          </div>
          <div className="collection-count">
            <strong>{total}</strong>
            <span>artículos</span>
          </div>
        </div>
      </section>

      {/* Sub-categories */}
      <div className="container" style={{ marginBottom: '32px' }}>
        <nav className="quick-links" style={{ justifyContent: 'flex-start' }}>
          <span>Temas:</span>
          {blogCategories.map((c) => (
            <Link key={c.id} href={`/${c.slug}/`}>
              {c.name}
            </Link>
          ))}
        </nav>
      </div>

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
            <h2>Aún no hay artículos en el blog</h2>
            <p>Vuelve pronto para descubrir nuevas historias e ideas.</p>
          </div>
        )}

        <Pagination current={1} total={totalPages} basePath="/blog" />
      </div>

      <StoreCta settings={settings} />
    </>
  );
}
