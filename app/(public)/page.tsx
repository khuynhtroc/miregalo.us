import Link from 'next/link';
import type { Metadata } from 'next';
import { getSettings, getCategories, getCategoryCounts, listPublishedPosts } from '@/lib/repo';
import { buildMetadata } from '@/lib/seo';
import { PostCard } from '@/components/PostCard';
import { StoreCta } from '@/components/StoreCta';
import type { Post } from '@/lib/types';
import { postPath } from '@/lib/urls';

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

  // Fetch posts for homepage sections
  const [featuredRes, editorRes, latestRes, blogRes] = await Promise.all([
    listPublishedPosts({ featured: true, perPage: 5 }),
    listPublishedPosts({ editorPick: true, perPage: 6 }),
    listPublishedPosts({ type: 'gift', perPage: 8 }),
    listPublishedPosts({ type: 'blog', perPage: 15 }),
  ]);

  // Featured stories
  let featuredPosts = featuredRes.rows;
  if (featuredPosts.length === 0) {
    featuredPosts = latestRes.rows.slice(0, 5);
  }
  const heroPost = featuredPosts[0];
  const secondaryFeatured = featuredPosts.slice(1, 5);

  // Group categories for Directory
  const recipients = categories.filter((c) => c.group === 'recipients');
  const occasions = categories.filter((c) => c.group === 'occasions');
  const interests = categories.filter((c) => c.group === 'interests');
  const blogCats = categories.filter((c) => c.group === 'blog');

  // Quick link topics
  const quickLinks = categories.filter((c) => c.quick_link).slice(0, 6);

  // Blog topic grouping for the 5 columns
  const blogPostsByCat = new Map<string, Post[]>();
  for (const bp of blogRes.rows) {
    const cids = Array.isArray(bp.category_ids) && bp.category_ids.length > 0
      ? bp.category_ids
      : (bp.primary_category_id ? [bp.primary_category_id] : []);
    for (const cid of cids) {
      const list = blogPostsByCat.get(cid) || [];
      list.push(bp);
      blogPostsByCat.set(cid, list);
    }
  }

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

      {/* ── Featured Section ──────────────────────── */}
      {heroPost && (
        <section className="section featured-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Selección para ti</p>
                <h2 className="section-title">Historias destacadas</h2>
              </div>
              <Link className="section-link" href="/gifts/">
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

      {/* ── Browse Gift Guides (Directory) ────────── */}
      <section className="section section-wash">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Empieza a explorar</p>
              <h2 className="section-title">Explorar guías de regalos</h2>
            </div>
            <p className="section-intro">
              Elige para quién buscas, el momento que celebras o algo que ya les encante.
            </p>
          </div>

          <div className="topic-directory">
            {/* Recipients */}
            <section className="topic-group">
              <div className="topic-group-header">
                <div>
                  <p className="eyebrow">Destinatarios</p>
                  <p>Ideas bien pensadas para cada persona importante.</p>
                </div>
                <Link href="/recipients/" aria-label="Ver todos los destinatarios">
                  Ver todos <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="topic-links">
                {recipients.map((c) => (
                  <Link key={c.id} href={`/${c.slug}/`}>
                    <span>{c.name}</span>
                    <small>{counts[c.id] ?? 0} artículos</small>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Occasions */}
            <section className="topic-group">
              <div className="topic-group-header">
                <div>
                  <p className="eyebrow">Ocasiones</p>
                  <p>Celebra aniversarios, fiestas y momentos cotidianos.</p>
                </div>
                <Link href="/occasions/" aria-label="Ver todas las ocasiones">
                  Ver todas <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="topic-links">
                {occasions.map((c) => (
                  <Link key={c.id} href={`/${c.slug}/`}>
                    <span>{c.name}</span>
                    <small>{counts[c.id] ?? 0} artículos</small>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Interests */}
            <section className="topic-group">
              <div className="topic-group-header">
                <div>
                  <p className="eyebrow">Intereses</p>
                  <p>Empieza con lo que les apasiona y hazlo personal.</p>
                </div>
                <Link href="/interests/" aria-label="Ver todos los intereses">
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

      {/* ── Editor’s Picks ────────────────────────── */}
      {editorRes.rows.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Recomendado</p>
                <h2 className="section-title">Selección del editor</h2>
              </div>
            </div>

            <div className="article-grid article-grid-three">
              {editorRes.rows.map((p) => (
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

      {/* ── Latest Gift Guides (Blue section) ─────── */}
      {latestRes.rows.length > 0 && (
        <section className="section section-blue">
          <div className="container">
            <div className="section-heading section-heading-light">
              <div>
                <p className="eyebrow">Nueva inspiración</p>
                <h2 className="section-title">Últimas guías de regalos</h2>
              </div>
              <Link className="section-link" href="/gifts/">
                Ver todas <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="article-grid article-grid-four">
              {latestRes.rows.map((p) => (
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

      {/* ── From the Blog ─────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Más formas de conectar</p>
              <h2 className="section-title">Desde el blog</h2>
            </div>
            <Link className="section-link" href="/blog/">
              Visitar el blog <span aria-hidden="true">→</span>
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
                    <Link href={`/${cat.slug}/`} aria-label={`View all ${cat.name} articles`}>
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

      {/* ── Store CTA ─────────────────────────────── */}
      <StoreCta settings={settings} />
    </>
  );
}
