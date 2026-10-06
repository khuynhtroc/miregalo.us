import Link from 'next/link';
import type { Metadata } from 'next';
import { getSettings, getCategories, getCategoryMap, listPublishedPosts } from '@/lib/repo';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `Buscar Guías de Regalos | ${settings.site_name}`,
    description: `Busca guías de regalos seleccionadas, ideas e inspiración en ${settings.site_name}.`,
    path: '/search/',
    type: 'website',
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q || '').trim();

  const [settings, categories, catMap] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryMap(),
  ]);

  const { rows: results } = query
    ? await listPublishedPosts({ q: query, perPage: 40 })
    : { rows: [] };

  const popularTopics = categories.filter((c) => c.quick_link).slice(0, 8);
  const breadcrumbs = [{ name: 'Buscar' }];

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <Breadcrumbs crumbs={breadcrumbs} />

      <section className="search-hero">
        <div className="container search-hero-inner">
          <p className="eyebrow">Buscar en la biblioteca</p>
          <h1>Encuentra lo que estás buscando</h1>
          <p className="lead" style={{ maxWidth: '620px', margin: '0 auto 24px' }}>
            Explora cientos de guías seleccionadas por destinatario, ocasión, afición o personalidad.
          </p>

          <form className="site-search" action="/search/" method="get" role="search">
            <label className="sr-only" htmlFor="main-search-input">
              Buscar en {settings.site_name}
            </label>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
            </svg>
            <input
              id="main-search-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={settings.search_placeholder || 'Buscar ideas de regalos, personas u ocasiones...'}
              autoComplete="off"
            />
            <button type="submit">Buscar</button>
          </form>

          <div style={{ marginTop: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', marginRight: '10px' }}>
              Búsquedas populares:
            </span>
            <div className="quick-links" style={{ display: 'inline-flex' }}>
              {popularTopics.map((pt) => (
                <Link key={pt.id} href={`/${pt.slug}/`}>
                  {pt.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '48px 0 64px' }}>
        {query ? (
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', color: 'var(--ink)' }}>
              {results.length > 0
                ? `Se encontraron ${results.length} resultados para "${query}"`
                : `No se encontraron resultados para "${query}"`}
            </h2>

            {results.length > 0 ? (
              <div className="article-grid article-grid-three">
                {results.map((p) => (
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
                <p>Prueba buscando con términos más sencillos como &quot;mamá&quot;, &quot;aniversario&quot; o &quot;parejas&quot;.</p>
                <div style={{ marginTop: '20px' }}>
                  <Link href="/gifts/" className="button">
                    Explorar todas las guías de regalos
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Explorar temas populares</h2>
            <div className="search-topic-links">
              {categories
                .filter((c) => c.group !== 'hub')
                .slice(0, 12)
                .map((cat) => (
                  <Link key={cat.id} href={`/${cat.slug}/`}>
                    <span>{cat.name}</span>
                    <span>→</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>

      <StoreCta settings={settings} />
    </>
  );
}
