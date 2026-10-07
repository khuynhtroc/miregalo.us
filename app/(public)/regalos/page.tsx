import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSettings, getCatalogUrls, getRelatedPostsForCatalog, getCategoryMap } from '@/lib/repo';
import { buildMetadata, breadcrumbSchema, collectionSchema, faqSchema } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductCard } from '@/components/ProductCard';
import { PostCard } from '@/components/PostCard';
import { JsonLd } from '@/components/JsonLd';
import { StoreCta } from '@/components/StoreCta';
import type { CatalogUrl, FaqItem } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings, {
    title: `Catálogo de Regalos: Ideas Originales y Guías de Compra | ${settings.site_name}`,
    description: 'Descubre el catálogo definitivo de regalos clasificados por destinatario, ocasión y estilo. Miles de ideas probadas y recomendadas.',
    path: '/regalos/',
    type: 'website',
  });
}

export default async function RegalosSiloPage() {
  const [settings, catalogUrls, productsRes, catMap] = await Promise.all([
    getSettings(),
    getCatalogUrls(),
    db.find('products', { eq: { active: true }, limit: 12 }),
    getCategoryMap(),
  ]);

  const featuredArticles = await getRelatedPostsForCatalog('Regalos', 4);

  const recipients = catalogUrls.filter((u) => u.url_type === 'RECIPIENT');
  const occasions = catalogUrls.filter((u) => u.url_type === 'OCCASION');
  const styles = catalogUrls.filter((u) => u.url_type === 'STYLE');

  const faqs: FaqItem[] = [
    {
      q: '¿Cómo elegir el mejor regalo según el destinatario?',
      a: 'Comienza identificando sus intereses clave, su rutina diaria y si prefiere regalos funcionales o recuerdos emotivos. Explora nuestras guías especializadas organizadas por parentesco y relación.',
    },
    {
      q: '¿Qué opciones son mejores cuando se busca algo de última hora?',
      a: 'Nuestras guías de última hora recomiendan productos con envío rápido en 24 horas a través de Amazon Prime, desayunos a domicilio y tarjetas regalo digitales con dedicatoria inmediata.',
    },
    {
      q: '¿Son recomendables los regalos personalizados?',
      a: 'Sí, los regalos con nombres grabados, fotos o fechas son los más valorados emocionalmente, especialmente para aniversarios, bodas y el Día de la Madre o del Padre.',
    },
  ];

  const crumbs = [{ name: 'Regalos', path: '/regalos/' }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          collectionSchema(
            'Catálogo Completo de Regalos',
            'Ideas de regalos seleccionadas para cada ocasión y persona especial.',
            '/regalos/',
            [],
            catalogUrls.length
          ),
          faqSchema(faqs),
        ]}
      />

      <Breadcrumbs crumbs={crumbs} />

      <main className="container category-page" style={{ paddingBottom: '60px' }}>
        {/* Hero Header */}
        <header className="category-header" style={{ marginBottom: '40px' }}>
          <span className="eyebrow" style={{ display: 'inline-block', marginBottom: '8px', color: '#e11d48', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Directorio Principal
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#171a35', margin: '0 0 16px', lineHeight: 1.2 }}>
            Guías de Regalos por Destinatario, Ocasión y Estilo
          </h1>
          <p className="lead" style={{ fontSize: '1.15rem', color: '#4b5563', maxWidth: '780px', lineHeight: 1.6, margin: 0 }}>
            Explora nuestra arquitectura completa de 92 guías temáticas organizadas cuidadosamente.
            Tanto si buscas un detalle emotivo para mamá como un regalo de última hora o una sorpresa romántica, aquí lo encontrarás.
          </p>
        </header>

        {/* ── SECCIÓN 1: POR DESTINATARIO ── */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              👥 Regalos por Destinatario ({recipients.length})
            </h2>
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Con subguías personalizadas</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {recipients.map((r) => (
              <div
                key={r.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <Link
                  href={r.url}
                  style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 600, fontSize: '1.05rem', display: 'block', marginBottom: '8px' }}
                >
                  {r.page_title} →
                </Link>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                  <Link href={`${r.url}personalizados/`} style={{ color: '#0284c7', background: '#f0f9ff', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                    Personalizados
                  </Link>
                  <Link href={`${r.url}que-lo-tiene-todo/`} style={{ color: '#d97706', background: '#fffbeb', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                    Tiene de todo
                  </Link>
                  <Link href={`${r.url}ultima-hora/`} style={{ color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                    Última hora
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 2: POR OCASIÓN ── */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              🎉 Regalos por Ocasión ({occasions.length})
            </h2>
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Fechas y eventos señalados</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {occasions.map((o) => (
              <Link
                key={o.id}
                href={o.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  fontWeight: 600,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span>{o.page_title}</span>
                <span style={{ color: '#e11d48', fontSize: '1.1rem' }}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 3: POR ESTILO ── */}
        <section style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              ✨ Regalos por Estilo ({styles.length})
            </h2>
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Originales, útiles, emotivos y románticos</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {styles.map((s) => (
              <Link
                key={s.id}
                href={s.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#0f172a',
                  fontWeight: 600,
                }}
              >
                <span>{s.page_title}</span>
                <span style={{ color: '#0284c7' }}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 4: ARTÍCULOS DESTACADOS DE AFILIADOS ── */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>
            Destacados del Mes: Los Regalos Más Populares
          </h2>
          <div className="catalog-product-grid">
            {productsRes.rows.map((product, idx) => (
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

        {/* ── SECCIÓN 5: GUÍAS Y ARTÍCULOS DESTACADOS ── */}
        {featuredArticles.length > 0 && (
          <section style={{ marginBottom: '56px' }}>
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
                  Inspiración editorial
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Guías y Artículos Recomendados de Regalos
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
                Explorar todos los artículos →
              </Link>
            </div>
            <div className="article-grid article-grid-four">
              {featuredArticles.map((art) => (
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

        {/* ── SECCIÓN 6: FAQ ACCORDION ── */}
        <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '36px', borderRadius: '16px', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
            Preguntas Frecuentes sobre el Catálogo de Regalos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
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

        {/* Store CTA */}
        <StoreCta settings={settings} />
      </main>
    </>
  );
}
