import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getSettings,
  getCategories,
  getCategoryBySlug,
  getCategoryMap,
  hubFilter,
  listPublishedPosts,
} from '@/lib/repo';
import {
  buildMetadata,
  collectionSchema,
  breadcrumbSchema,
  categoryDescription,
} from '@/lib/seo';
import { RESERVED_ROOT_SLUGS } from '@/lib/urls';
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
  if (RESERVED_ROOT_SLUGS.has(slug)) return {};

  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) return {};

  const settings = await getSettings();
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const desc = categoryDescription(category, settings);
  return buildMetadata(settings, {
    title: `${category.name} - Página ${page} | ${settings.site_name}`,
    description: desc,
    path: `/${category.slug}/page/${page}/`,
    type: 'website',
  });
}

export default async function CategoryPaginationPage({ params }: PageProps) {
  const { slug, page: pageStr } = await params;
  if (RESERVED_ROOT_SLUGS.has(slug)) notFound();

  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  const [settings, categories, catMap] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryMap(),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const perPage = settings.posts_per_page || 24;
  const filter = await hubFilter(category.slug);

  let listOpts: Parameters<typeof listPublishedPosts>[0] = {
    page,
    perPage,
  };

  if (filter.categoryIds) {
    listOpts.categoryIds = filter.categoryIds;
  } else if (filter.type) {
    listOpts.type = filter.type;
  } else {
    listOpts.categoryId = category.id;
  }

  const { rows: posts, total } = await listPublishedPosts(listOpts);
  const totalPages = Math.ceil(total / perPage);

  if (page > totalPages && totalPages > 0) notFound();

  const breadcrumbs = [
    ...(category.group !== 'hub'
      ? [{ name: category.group.charAt(0).toUpperCase() + category.group.slice(1), path: `/${category.group}/` }]
      : []),
    { name: category.name, path: `/${category.slug}/` },
    { name: `Página ${page}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          collectionSchema(
            `${category.name} - Página ${page}`,
            categoryDescription(category, settings),
            `/${category.slug}/page/${page}/`,
            posts,
            total
          ),
        ]}
      />

      <Breadcrumbs crumbs={breadcrumbs} />

      <section className="collection-hero">
        <div className="container collection-hero-inner">
          <div>
            <p className="eyebrow">{category.eyebrow || 'Guías de regalos'}</p>
            <h1>{category.name}</h1>
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

        <Pagination current={page} total={totalPages} basePath={`/${category.slug}`} />
      </div>

      <StoreCta settings={settings} />
    </>
  );
}
