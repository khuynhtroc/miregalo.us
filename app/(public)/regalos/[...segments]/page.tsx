import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSettings, getCatalogUrls, getCatalogUrlByPath, getKeywordsForUrl, getRelatedPostsForCatalog, getCategoryMap } from '@/lib/repo';
import { buildMetadata, breadcrumbSchema, collectionSchema, faqSchema } from '@/lib/seo';
import { getCatalogContent } from '@/lib/catalog-content';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { ProductCard } from '@/components/ProductCard';
import { PostCard } from '@/components/PostCard';
import { JsonLd } from '@/components/JsonLd';
import { StoreCta } from '@/components/StoreCta';
import type { Product } from '@/lib/types';

interface PageProps {
  params: Promise<{ segments: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segments } = await params;
  const path = `/regalos/${segments.join('/')}/`;
  const catalogUrl = await getCatalogUrlByPath(path);
  if (!catalogUrl) return {};

  const settings = await getSettings();
  const content = getCatalogContent(catalogUrl);

  return buildMetadata(settings, {
    title: `${catalogUrl.page_title} | ${settings.site_name}`,
    description: catalogUrl.meta_description || content.lead,
    path: catalogUrl.url,
    canonical: catalogUrl.url,
    type: 'website',
  });
}

export default async function CatalogDynamicPage({ params }: PageProps) {
  const { segments } = await params;
  const path = `/regalos/${segments.join('/')}/`;
  const catalogUrl = await getCatalogUrlByPath(path);

  if (!catalogUrl) {
    notFound();
  }

  const [settings, allCatalogUrls, keywords, productsRes, catMap] = await Promise.all([
    getSettings(),
    getCatalogUrls(),
    getKeywordsForUrl(catalogUrl.id),
    db.find('products', { eq: { active: true }, limit: 20 }),
    getCategoryMap(),
  ]);

  const relatedArticles = await getRelatedPostsForCatalog(catalogUrl.page_title, 4);

  const content = getCatalogContent(catalogUrl);

  // Filter products by matching tags, or fallback to general active products
  let matchedProducts = productsRes.rows.filter((p) => {
    if (!p.tags || !p.tags.length) return false;
    return content.matchingTags.some((tag) => p.tags.includes(tag));
  });

  if (matchedProducts.length === 0) {
    matchedProducts = productsRes.rows.slice(0, 6);
  }

  // Construct Breadcrumbs
  const crumbs: Crumb[] = [{ name: 'Regalos', path: '/regalos/' }];

  if (segments.length === 1) {
    crumbs.push({ name: catalogUrl.page_title, path: catalogUrl.url });
  } else if (segments.length >= 2) {
    // Find parent catalog URL
    const parentPath = `/regalos/${segments[0]}/`;
    const parentUrl = allCatalogUrls.find((u) => u.url === parentPath);
    if (parentUrl) {
      crumbs.push({ name: parentUrl.page_title, path: parentUrl.url });
    }
    // Sub-segment label
    let subName = segments[1];
    if (subName === 'personalizados') subName = 'Personalizados';
    else if (subName === 'que-lo-tiene-todo') subName = 'Tiene de todo';
    else if (subName === 'ultima-hora') subName = 'Última hora';
    else subName = catalogUrl.page_title;

    crumbs.push({ name: subName, path: catalogUrl.url });
  }

  // Sibling sub-routes if this is a recipient page or sub-page
  let subLinks: { label: string; url: string; active: boolean }[] = [];
  if (catalogUrl.url_type.startsWith('RECIPIENT')) {
    const baseRecipientPath = `/regalos/${segments[0]}/`;
    subLinks = [
      { label: '🌟 Todos los regalos', url: baseRecipientPath, active: catalogUrl.url === baseRecipientPath },
      { label: '🎨 Personalizados', url: `${baseRecipientPath}personalizados/`, active: catalogUrl.url === `${baseRecipientPath}personalizados/` },
      { label: '🎁 Tiene de todo', url: `${baseRecipientPath}que-lo-tiene-todo/`, active: catalogUrl.url === `${baseRecipientPath}que-lo-tiene-todo/` },
      { label: '⚡ Última hora', url: `${baseRecipientPath}ultima-hora/`, active: catalogUrl.url === `${baseRecipientPath}ultima-hora/` },
    ];
  }

  // Related sibling pages to foster strong internal linking
  const siblingPages = allCatalogUrls
    .filter((u) => u.url_type === catalogUrl.url_type && u.id !== catalogUrl.id)
    .slice(0, 8);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          collectionSchema(
            catalogUrl.page_title,
            catalogUrl.meta_description || content.lead,
            catalogUrl.url,
            [],
            matchedProducts.length
          ),
          faqSchema(content.faqs),
        ]}
      />

      <Breadcrumbs crumbs={crumbs} />

      <main className="container category-page" style={{ paddingBottom: '60px' }}>
        {/* Hero Header */}
        <header className="category-header" style={{ marginBottom: '32px' }}>
          <span
            className="eyebrow"
            style={{
              display: 'inline-block',
              marginBottom: '8px',
              color: '#e11d48',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {content.eyebrow}
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#171a35', margin: '0 0 16px', lineHeight: 1.25 }}>
            {content.h1}
          </h1>
          <p className="lead" style={{ fontSize: '1.15rem', color: '#4b5563', maxWidth: '820px', lineHeight: 1.6, margin: 0 }}>
            {content.lead}
          </p>
        </header>

        {/* Sub-Navigation Pills (for Recipient and Sub-routes) */}
        {subLinks.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '40px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            {subLinks.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: link.active ? '#1e293b' : '#ffffff',
                  color: link.active ? '#ffffff' : '#334155',
                  border: link.active ? '1px solid #1e293b' : '1px solid #cbd5e1',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── ÍNDICE RÁPIDO DE LA PÁGINA ── */}
        <nav
          className="catalog-quick-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '36px',
            padding: '12px 18px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '0.86rem',
          }}
        >
          <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📑</span>
            <span>Índice rápido:</span>
          </span>
          <a
            href="#ideas-destacadas"
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
            }}
          >
            🎁 Productos ({matchedProducts.length})
          </a>
          {content.tips && content.tips.length > 0 && (
            <a
              href="#consejos"
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              💡 Consejos de compra
            </a>
          )}
          {content.faqs && content.faqs.length > 0 && (
            <a
              href="#faqs"
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              ❓ Preguntas frecuentes
            </a>
          )}
          {relatedArticles.length > 0 && (
            <a
              href="#articulos-recomendados"
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              📚 Artículos relacionados
            </a>
          )}
        </nav>

        {/* ── SECCIÓN 1: PRODUCTOS SELECCIONADOS ── */}
        <section id="ideas-destacadas" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                Ideas y Regalos Destacados
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
                Recomendaciones con precios en tiempo real y disponibilidad inmediata
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#0284c7', background: '#f0f9ff', padding: '6px 14px', borderRadius: '999px', border: '1px solid #dbeafe', fontWeight: 600 }}>
              ✨ {matchedProducts.length} opciones seleccionadas
            </span>
          </div>

          <div className="catalog-product-grid">
            {matchedProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                index={idx}
                variant="card"
                productSlug={product.slug}
                item={{
                  heading: product.name,
                  image: product.image,
                  merchant: product.merchant,
                  price: product.price,
                  description_html: `<p>${product.description}</p>`,
                  button_label: `Ver en ${product.merchant}`,
                  url: product.url,
                }}
              />
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 2: CONSEJOS Y GUÍA DEL COMPRADOR ── */}
        <section id="consejos" style={{ marginBottom: '56px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '36px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
            Consejos para Acertar al 100%
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {content.tips.map((tip, idx) => (
              <div key={idx} style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fee2e2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', marginBottom: '14px' }}>
                  {idx + 1}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                  {tip.title}
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.55 }}>
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 3: PREGUNTAS FRECUENTES (FAQ) ── */}
        {content.faqs && content.faqs.length > 0 && (
          <section id="faqs" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
              Preguntas Frecuentes ({content.faqs.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {content.faqs.map((faq, i) => (
                <details
                  key={i}
                  style={{
                    background: '#ffffff',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <summary style={{ fontWeight: 600, fontSize: '1.02rem', color: '#0f172a', cursor: 'pointer' }}>
                    {faq.q}
                  </summary>
                  <p style={{ margin: '12px 0 0', color: '#475569', lineHeight: 1.65, fontSize: '0.92rem' }}>
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── SECCIÓN 4: ARTÍCULOS Y GUÍAS EDITORIALES RELACIONADAS ── */}
        {relatedArticles.length > 0 && (
          <section id="articulos-recomendados" style={{ marginBottom: '56px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#e11d48',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Lecturas recomendadas
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Artículos y Guías para {catalogUrl.page_title}
                </h2>
              </div>
              <Link
                href="/blog/"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#e11d48',
                  textDecoration: 'none',
                }}
              >
                Ver todo el blog →
              </Link>
            </div>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.94rem', maxWidth: '780px' }}>
              Consejos prácticos, listas temáticas y recomendaciones de nuestro equipo para complementar tu elección.
            </p>
            <div className="article-grid article-grid-four">
              {relatedArticles.map((art) => (
                <PostCard
                  key={art.id}
                  post={art}
                  category={art.primary_category_id ? catMap.get(art.primary_category_id) : null}
                  variant="standard"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── SECCIÓN 5: ENLACES INTERNOS Y OTRAS GUÍAS RELACIONADAS ── */}
        <section style={{ marginBottom: '48px', borderTop: '1px solid #e2e8f0', paddingTop: '36px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
            Otras Guías Relacionadas
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/regalos/"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '0.88rem',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              ← Todos los regalos
            </Link>
            {siblingPages.map((sib) => (
              <Link
                key={sib.id}
                href={sib.url}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                {sib.page_title}
              </Link>
            ))}
          </div>
        </section>

        {/* Store CTA */}
        <StoreCta settings={settings} />
      </main>
    </>
  );
}
