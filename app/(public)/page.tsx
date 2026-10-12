import Link from 'next/link';
import type { Metadata } from 'next';
import { getSettings, getCategories, getCategoryCounts, listPublishedPosts } from '@/lib/repo';
import { buildMetadata } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import { StoreCta } from '@/components/StoreCta';
import type { Post } from '@/lib/types';
import { postPath } from '@/lib/urls';

export const revalidate = 60; // Revalidate at most every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `${settings.site_name} | ${settings.site_tagline}`,
    description: settings.site_description,
    path: '/',
    type: 'website',
  });
}

export default async function HomePage() {
  const [settings, categories, counts] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryCounts(),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Fetch gift posts and editor picks for homepage sections
  const [editorRes, latestRes] = await Promise.all([
    listPublishedPosts({ editorPick: true, perPage: 6 }),
    listPublishedPosts({ type: 'gift', perPage: 16 }),
  ]);

  // Sort categories by popularity / content volume descending
  const recipients = categories
    .filter((c) => c.group === 'recipients')
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  const occasions = categories
    .filter((c) => c.group === 'occasions')
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  const interests = categories
    .filter((c) => c.group === 'interests')
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  const blogCats = categories
    .filter((c) => c.group === 'blog')
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  // Quick link topics sorted by popularity
  const quickLinks = categories
    .filter((c) => c.quick_link)
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    .slice(0, 6);

  // Fetch top 3 posts per blog category sorted by most popular
  const blogCatEntries = await Promise.all(
    blogCats.map(async (cat) => {
      const { rows } = await listPublishedPosts({
        type: 'blog',
        categoryId: cat.id,
        perPage: 3,
      });
      return [cat.id, rows] as const;
    })
  );
  const blogPostsByCat = new Map(blogCatEntries);

  // Refresh recommended & featured posts:
  // Prioritize the newly generated comprehensive 7,740-word guide "Los 12 Mejores Regalos para Mamá" or top editor pick as hero
  const allGifts = latestRes.rows;
  const mamaPost = allGifts.find((p) => p.slug === 'ideas-de-regalos-para-mama');
  const otherGifts = allGifts.filter((p) => p.slug !== 'ideas-de-regalos-para-mama');

  const heroPost = mamaPost || allGifts[0];
  const secondaryFeatured = otherGifts.slice(0, 4);

  // Editor's picks (excluding heroPost)
  const editorPicks = (
    editorRes.rows.filter((p) => p.id !== heroPost?.id).length > 0
      ? editorRes.rows.filter((p) => p.id !== heroPost?.id)
      : otherGifts.slice(4, 10)
  ).slice(0, 6);

  // Latest remaining gift guides for the blue inspiration section
  const remainingLatest = otherGifts.slice(4, 12);

  return (
    <>
      {/* ── Home Hero ────────────────────────────── */}
      <section className="home-hero" data-pagefind-ignore>
        <div className="container hero-content">
          <p className="eyebrow">{settings.hero_eyebrow || 'Ideas con significado, hechas personales'}</p>
          <h1>{settings.hero_title || 'Encuentra un regalo que recordarán siempre'}</h1>
          <p className="hero-lead">
            {settings.hero_lead ||
              'Explora guías detalladas para cada persona, relación y ocasión, y transforma la idea perfecta en un recuerdo inolvidable.'}
          </p>

          <form className="site-search" action="/search/" method="get" role="search">
            <label className="sr-only" htmlFor="site-search">
              Buscar en {settings.site_name}
            </label>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
            </svg>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder={settings.search_placeholder || 'Buscar ideas de regalos, personas u ocasiones...'}
              autoComplete="off"
            />
            <button type="submit">Buscar</button>
          </form>

          <nav className="quick-links" aria-label="Temas populares de regalos">
            <span>Populares:</span>
            {quickLinks.map((ql) => (
              <Link key={ql.id} href={`/${ql.slug}/`}>
                {ql.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hero-decoration hero-decoration-one" aria-hidden="true" />
        <div className="hero-decoration hero-decoration-two" aria-hidden="true" />
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. SECTION CHỦ ĐỀ (EXPLORAR POR TEMAS MÁS BUSCADOS)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="section section-wash">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tendencias &amp; Categorías</p>
              <h2 className="section-title">Explorar Guías por Temas Más Buscados</h2>
            </div>
            <p className="section-intro">
              Encuentra inspiración navegando por nuestros temas más populares: destinatarios, ocasiones especiales y aficiones favoritas.
            </p>
          </div>

          <div className="topic-directory">
            {/* Destinatarios */}
            <section className="topic-group">
              <div className="topic-group-header">
                <div>
                  <p className="eyebrow">Destinatarios Populares</p>
                  <p>Ideas bien pensadas para cada persona importante en tu vida.</p>
                </div>
                <Link href="/destinatarios/" aria-label="Ver todos los destinatarios">
                  Ver todos <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="topic-links">
                {recipients.map((c, i) => (
                  <Link key={c.id} href={`/${c.slug}/`}>
                    <span>{c.name}</span>
                    <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {i < 3 && <span style={{ color: '#e11d48', fontSize: '0.74rem' }}>🔥</span>}
                      {counts[c.id] ?? 0} artículos
                    </small>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Ocasiones */}
            <section className="topic-group">
              <div className="topic-group-header">
                <div>
                  <p className="eyebrow">Ocasiones con Mayor Búsqueda</p>
                  <p>Celebra aniversarios, cumpleaños, San Valentín y momentos cotidianos.</p>
                </div>
                <Link href="/ocasiones/" aria-label="Ver todas las ocasiones">
                  Ver todas <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="topic-links">
                {occasions.map((c, i) => (
                  <Link key={c.id} href={`/${c.slug}/`}>
                    <span>{c.name}</span>
                    <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {i < 3 && <span style={{ color: '#e11d48', fontSize: '0.74rem' }}>🔥</span>}
                      {counts[c.id] ?? 0} artículos
                    </small>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Intereses */}
            <section className="topic-group">
              <div className="topic-group-header">
                <div>
                  <p className="eyebrow">Intereses &amp; Pasiones</p>
                  <p>Sorprende con lo que verdaderamente les apasiona y emociona.</p>
                </div>
                <Link href="/intereses/" aria-label="Ver todos los intereses">
                  Ver todos <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="topic-links">
                {interests.map((c) => (
                  <Link key={c.id} href={`/${c.slug}/`}>
                    <span>{c.name}</span>
                    <small>{counts[c.id] ?? 0} artículos</small>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. SECTION BLOG (DESDE EL BLOG - INSPIRACIÓN & CONSEJOS)       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inspiración, Mensajes y Consejos</p>
              <h2 className="section-title">Artículos Más Leídos del Blog</h2>
            </div>
            <Link className="section-link" href="/blog/">
              Visitar el blog completo <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="blog-topics-grid">
            {blogCats.map((cat) => {
              const catPosts = blogPostsByCat.get(cat.id) || [];
              const firstPost = catPosts[0];
              const remainingPosts = catPosts.slice(1, 3);

              return (
                <section key={cat.id} className="blog-topic">
                  <div className="blog-topic-heading">
                    <h3>
                      <Link href={`/${cat.slug}/`}>{cat.name}</Link>
                    </h3>
                    <Link href={`/${cat.slug}/`} aria-label={`Ver todos los artículos de ${cat.name}`}>
                      →
                    </Link>
                  </div>

                  {firstPost && (
                    <PostCard
                      post={firstPost}
                      category={cat}
                      variant="compact"
                    />
                  )}

                  {remainingPosts.length > 0 && (
                    <ul className="article-link-list">
                      {remainingPosts.map((rp) => (
                        <li key={rp.id}>
                          <Link href={postPath(rp)}>{rp.title}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. SECTION RECOMMEND & POPULARES (GUÍAS RECOMENDADAS)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {heroPost && (
        <section className="section featured-section" style={{ background: '#fafaf9', borderTop: '1px solid #f0f0ee', borderBottom: '1px solid #f0f0ee' }}>
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">⭐ Selección Exclusiva &amp; Recomendados</p>
                <h2 className="section-title">Guías de Regalos Más Recomendadas y Populares</h2>
              </div>
              <Link className="section-link" href="/regalos/">
                Explorar todas las guías <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="featured-grid">
              <PostCard
                post={heroPost}
                category={heroPost.primary_category_id ? catMap.get(heroPost.primary_category_id) : null}
                variant="featured"
                priority
              />

              <div className="featured-secondary">
                {secondaryFeatured.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    category={p.primary_category_id ? catMap.get(p.primary_category_id) : null}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. SELECCIÓN DEL EDITOR (RECOMENDADOS POR EL EQUIPO) ──── */}
      {editorPicks.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Top Recomendado</p>
                <h2 className="section-title">Selección del Editor</h2>
              </div>
            </div>

            <div className="article-grid article-grid-three">
              {editorPicks.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  category={p.primary_category_id ? catMap.get(p.primary_category_id) : null}
                  variant="standard"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. ÚLTIMAS GUÍAS DE REGALOS (BLUE INSPIRATION SECTION) ── */}
      {remainingLatest.length > 0 && (
        <section className="section section-blue">
          <div className="container">
            <div className="section-heading section-heading-light">
              <div>
                <p className="eyebrow">Nueva inspiración</p>
                <h2 className="section-title">Últimas Guías de Regalos</h2>
              </div>
              <Link className="section-link" href="/regalos/">
                Ver todas <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="article-grid article-grid-four">
              {remainingLatest.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  category={p.primary_category_id ? catMap.get(p.primary_category_id) : null}
                  variant="standard"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Store CTA ─────────────────────────────── */}
      <StoreCta settings={settings} />
    </>
  );
}
