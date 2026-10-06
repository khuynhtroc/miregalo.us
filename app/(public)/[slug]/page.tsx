import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import {
  getSettings,
  getCategories,
  getCategoryBySlug,
  getCategoryMap,
  getAuthorById,
  hubFilter,
  listPublishedPosts,
  getPublishedPost,
} from '@/lib/repo';
import {
  buildMetadata,
  postMetadata,
  collectionSchema,
  blogPostingSchema,
  itemListOfProducts,
  faqSchema,
  breadcrumbSchema,
  categoryDescription,
} from '@/lib/seo';
import { RESERVED_ROOT_SLUGS, postPath } from '@/lib/urls';
import { PostCard } from '@/components/PostCard';
import { ProductCard } from '@/components/ProductCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';
import { ContactForm } from '@/components/ContactForm';
import { fmtDate } from '@/lib/format';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_ROOT_SLUGS.has(slug)) return {};

  const settings = await getSettings();
  const category = await getCategoryBySlug(slug);

  if (category) {
    const desc = categoryDescription(category, settings);
    return buildMetadata(settings, {
      title: category.seo_title || `${category.name} | ${settings.site_name}`,
      description: desc,
      path: `/${category.slug}/`,
      type: 'website',
      image: category.hero_image,
    });
  }

  const post = await getPublishedPost(['gift', 'page'], slug);
  if (post) {
    return postMetadata(settings, post);
  }
  const blogPost = await getPublishedPost('blog', slug);
  if (blogPost) {
    return postMetadata(settings, blogPost);
  }

  return {};
}

export default async function DynamicSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (RESERVED_ROOT_SLUGS.has(slug)) notFound();

  const [settings, categories, catMap] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryMap(),
  ]);

  const category = categories.find((c) => c.slug === slug);

  // ─────────────────────────────────────────────────────────────
  // 1. CATEGORY OR HUB TEMPLATE
  // ─────────────────────────────────────────────────────────────
  if (category) {
    const perPage = settings.posts_per_page || 24;
    const filter = await hubFilter(category.slug);

    let listOpts: Parameters<typeof listPublishedPosts>[0] = {
      page: 1,
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

    // Sub-pills for hub pages
    const subCategories =
      category.group === 'hub'
        ? categories.filter((c) => {
            if (category.slug === 'recipients' || category.slug === 'destinatarios') return c.group === 'recipients';
            if (category.slug === 'occasions' || category.slug === 'ocasiones') return c.group === 'occasions';
            if (category.slug === 'interests' || category.slug === 'intereses') return c.group === 'interests';
            return false;
          })
        : [];

    const breadcrumbs = [
      ...(category.group !== 'hub'
        ? [{ name: category.group.charAt(0).toUpperCase() + category.group.slice(1), path: `/${category.group}/` }]
        : []),
      { name: category.name },
    ];

    return (
      <>
        <JsonLd
          data={[
            breadcrumbSchema(breadcrumbs),
            collectionSchema(category.name, categoryDescription(category, settings), `/${category.slug}/`, posts, total),
          ]}
        />

        <Breadcrumbs crumbs={breadcrumbs} />

        {/* Collection Hero */}
        <section className="collection-hero">
          <div className="container collection-hero-inner">
            <div>
              <p className="eyebrow">{category.eyebrow || 'Guías de regalos'}</p>
              <h1>{category.name}</h1>
              {category.short_intro && <p className="collection-description">{category.short_intro}</p>}
            </div>
            <div className="collection-count">
              <strong>{total}</strong>
              <span>artículos</span>
            </div>
          </div>
        </section>

        {/* Sub-category pills */}
        {subCategories.length > 0 && (
          <div className="container" style={{ marginBottom: '32px' }}>
            <nav className="quick-links" style={{ justifyContent: 'flex-start' }}>
              <span>Explorar:</span>
              {subCategories.map((sc) => (
                <Link key={sc.id} href={`/${sc.slug}/`}>
                  {sc.name}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Post Grid */}
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
              <h2>Aún no hay artículos publicados</h2>
              <p>Vuelve pronto para descubrir recomendaciones y guías de regalos en esta categoría.</p>
            </div>
          )}

          <Pagination current={1} total={totalPages} basePath={`/${category.slug}`} />
        </div>

        {/* Category bottom description if present */}
        {category.description_html && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="container prose" dangerouslySetInnerHTML={{ __html: category.description_html }} />
          </section>
        )}

        <StoreCta settings={settings} />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. POST (GIFT GUIDE OR STATIC PAGE)
  // ─────────────────────────────────────────────────────────────
  const post = await getPublishedPost(['gift', 'page'], slug);
  if (!post) {
    const blogPost = await getPublishedPost('blog', slug);
    if (blogPost) {
      return permanentRedirect(`/blog/${slug}/`);
    }
    const redirectRule =
      (await db.findOne('redirects', { source: `/${slug}/`, active: true })) ||
      (await db.findOne('redirects', { source: `/${slug}`, active: true }));
    if (redirectRule) {
      try {
        await db.increment('redirects', redirectRule.id, 'hits');
      } catch {
        // non-fatal
      }
      return permanentRedirect(redirectRule.destination);
    }
    notFound();
  }

  // 2A: STATIC PAGE
  if (post.type === 'page') {
    const isContactPage = post.slug === 'contacto' || post.slug === 'contact';
    const staticNavPages = [
      { slug: 'sobre-nosotros', title: 'Sobre Nosotros', icon: '✨' },
      { slug: 'contacto', title: 'Contacto', icon: '✉️' },
      { slug: 'faqs', title: 'Preguntas Frecuentes', icon: '❓' },
      { slug: 'politica-de-privacidad', title: 'Política de Privacidad', icon: '🔒' },
      { slug: 'terminos-y-condiciones', title: 'Términos y Condiciones', icon: '📜' },
      { slug: 'politica-de-cookies', title: 'Política de Cookies', icon: '🍪' },
      { slug: 'divulgacion-de-afiliados', title: 'Divulgación de Afiliados', icon: '⚖️' },
    ];

    const breadcrumbs = [{ name: 'Inicio', path: '/' }, { name: post.title }];

    return (
      <>
        <JsonLd
          data={[
            breadcrumbSchema(breadcrumbs),
            blogPostingSchema(settings, post, null),
            post.faqs && post.faqs.length > 0 ? faqSchema(post.faqs) : null,
          ].filter(Boolean)}
        />
        <Breadcrumbs crumbs={breadcrumbs} />
        <div className="container article-layout" style={{ paddingTop: '28px', paddingBottom: '80px' }}>
          <article className="article-main" data-pagefind-body>
            <header className="article-header" style={{ marginBottom: '28px' }}>
              <span className="eyebrow">Miregalo · Información y Legal</span>
              <h1 data-pagefind-meta="title" style={{ margin: '8px 0 16px' }}>
                {post.title}
              </h1>
              {post.excerpt && <p className="article-deck">{post.excerpt}</p>}
              <div className="article-date" style={{ color: 'var(--muted)', marginTop: '8px' }}>
                Actualizado el {fmtDate(post.updated_at || post.published_at || post.created_at)}
              </div>
            </header>

            {post.intro_html && (
              <div
                className="article-content prose"
                style={{ marginBottom: '28px' }}
                dangerouslySetInnerHTML={{ __html: post.intro_html }}
              />
            )}

            {isContactPage && <ContactForm />}

            {post.content_html && (
              <div
                className="article-content prose"
                style={{ marginTop: isContactPage ? '36px' : '0' }}
                dangerouslySetInnerHTML={{ __html: post.content_html }}
              />
            )}

            {post.faqs && post.faqs.length > 0 && (
              <section style={{ marginTop: '48px' }}>
                <h2>Preguntas Frecuentes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  {post.faqs.map((faq, idx) => (
                    <details
                      key={idx}
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        background: '#fff',
                      }}
                    >
                      <summary style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}>
                        {faq.q}
                      </summary>
                      <div
                        style={{ marginTop: '10px', color: 'var(--muted)', fontSize: '0.94rem' }}
                        dangerouslySetInnerHTML={{ __html: faq.a }}
                      />
                    </details>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Static Pages Navigation Sidebar */}
          <aside className="article-aside">
            <div className="aside-related" style={{ padding: '20px' }}>
              <p className="aside-title" style={{ fontSize: '0.95rem' }}>
                Páginas de Miregalo
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0 }}>
                {staticNavPages.map((pg) => {
                  const isCurrent = post.slug === pg.slug;
                  return (
                    <li key={pg.slug}>
                      <Link
                        href={`/${pg.slug}/`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: isCurrent ? 700 : 500,
                          background: isCurrent ? 'var(--wash, #fff8f9)' : 'transparent',
                          color: isCurrent ? 'var(--pink-dark, #c92f49)' : 'var(--ink, #20212a)',
                          textDecoration: 'none',
                          border: isCurrent ? '1px solid #ffd6dc' : '1px solid transparent',
                        }}
                      >
                        <span>{pg.icon}</span>
                        <span>{pg.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
        <StoreCta settings={settings} />
      </>
    );
  }

  // 2B: GIFT GUIDE
  const primaryCat = post.primary_category_id ? catMap.get(post.primary_category_id) : null;
  const author = await getAuthorById(post.author_id);
  const { rows: relatedPosts } = await listPublishedPosts({
    categoryId: post.primary_category_id || undefined,
    excludeId: post.id,
    perPage: 4,
  });

  const breadcrumbs = [
    ...(primaryCat
      ? [
          { name: primaryCat.group.charAt(0).toUpperCase() + primaryCat.group.slice(1), path: `/${primaryCat.group}/` },
          { name: primaryCat.name, path: `/${primaryCat.slug}/` },
        ]
      : [{ name: 'Regalos', path: '/regalos/' }]),
    { name: post.title },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(breadcrumbs),
          blogPostingSchema(settings, post, author),
          itemListOfProducts(post),
          faqSchema(post.faqs),
        ].filter(Boolean)}
      />

      <Breadcrumbs crumbs={breadcrumbs} />

      <div className="container article-layout">
        <article className="article-main" data-pagefind-body>
          {/* Header */}
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

          {/* Affiliate Disclosure */}
          {settings.affiliate_disclosure && (
            <div className="notice" style={{ marginBottom: '24px', fontSize: '0.85rem' }}>
              ℹ️ {settings.affiliate_disclosure}
            </div>
          )}

          {/* Intro HTML */}
          {post.intro_html && (
            <div
              className="article-content prose"
              style={{ marginBottom: '32px' }}
              dangerouslySetInnerHTML={{ __html: post.intro_html }}
            />
          )}

          {/* Numbered Product List */}
          {post.items && post.items.length > 0 && (
            <div className="article-content">
              {post.items.map((item, idx) => (
                <ProductCard
                  key={idx}
                  item={item}
                  index={idx}
                  variant="row"
                />
              ))}
            </div>
          )}

          {/* Bottom Line / Conclusion HTML */}
          {post.content_html && (
            <div
              className="article-content prose"
              style={{ marginTop: '40px' }}
              dangerouslySetInnerHTML={{ __html: post.content_html }}
            />
          )}

          {/* FAQ Accordion */}
          {post.faqs && post.faqs.length > 0 && (
            <section style={{ marginTop: '48px' }}>
              <h2>Preguntas frecuentes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {post.faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      background: '#fff',
                    }}
                  >
                    <summary style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}>
                      {faq.q}
                    </summary>
                    <div
                      style={{ marginTop: '10px', color: 'var(--muted)', fontSize: '0.94rem' }}
                      dangerouslySetInnerHTML={{ __html: faq.a }}
                    />
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Author Box */}
          {author && (
            <div
              style={{
                marginTop: '48px',
                padding: '24px',
                borderRadius: '16px',
                background: 'var(--wash)',
                border: '1px solid var(--line)',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--pink)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {author.name.charAt(0)}
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{author.name}</strong>
                {author.job_title && <p style={{ margin: '2px 0 6px', fontSize: '0.82rem', color: 'var(--muted)' }}>{author.job_title}</p>}
                <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }} dangerouslySetInnerHTML={{ __html: author.bio_html }} />
              </div>
            </div>
          )}

          <StoreCta settings={settings} variant="in-article" />
        </article>

        {/* Sidebar */}
        <aside className="article-aside">
          {relatedPosts.length > 0 && (
            <div className="aside-related">
              <p className="aside-title">Guías relacionadas</p>
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

      {/* Related Section at Bottom */}
      {relatedPosts.length > 0 && (
        <section className="section section-wash">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{primaryCat?.name || 'Relacionado'}</p>
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
