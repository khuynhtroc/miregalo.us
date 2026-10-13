import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSettings, listPublishedPosts } from '@/lib/repo';
import { SITE_URL } from '@/lib/urls';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { stripHtml } from '@/lib/format';
import { PostCard } from '@/components/PostCard';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function resolveProduct(rawSlug: string) {
  const cleanSlug = decodeURIComponent(rawSlug || '').trim().replace(/^\/p\//, '').replace(/\/$/, '');
  const flatSlug = cleanSlug.replace(/\//g, '-');

  let product: any =
    (await db.findOne('products', { slug: cleanSlug, active: true })) ||
    (await db.findOne('products', { slug: flatSlug, active: true }));

  if (!product && cleanSlug.startsWith('prod-')) {
    const stripped = cleanSlug.replace(/^prod-/, '');
    product =
      (await db.findOne('products', { slug: stripped, active: true })) ||
      (await db.findOne('products', { id: `prod-${stripped}`, active: true }));
  }

  if (!product && !cleanSlug.startsWith('prod-')) {
    product =
      (await db.findOne('products', { id: `prod-${cleanSlug}`, active: true })) ||
      (await db.findOne('products', { id: `prod-${flatSlug}`, active: true }));
  }

  let post: any = null;

  // Resolve from post.items if not yet registered in products table
  const itemMatch = cleanSlug.match(/^(.+)-item-(\d+)$/i);
  if (itemMatch) {
    const postSlug = itemMatch[1];
    const itemNum = parseInt(itemMatch[2], 10);
    const itemIdx = itemNum - 1;

    post =
      (await db.findOne('posts', { slug: postSlug })) ||
      (await db.findOne('posts', { id: postSlug })) ||
      (await db.findOne('posts', { id: `post-${postSlug}` }));

    if (!product && post && post.items && Array.isArray(post.items) && post.items[itemIdx]) {
      const item = post.items[itemIdx];
      product = {
        id: `prod-${cleanSlug}`,
        slug: cleanSlug,
        name: item.heading || `${post.title} #${itemNum}`,
        url: item.url || `/go/${cleanSlug}`,
        merchant: item.merchant || 'Amazon España',
        image: item.image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
        price: item.price || '29,99 €',
        currency: 'EUR',
        description: item.description_html || '<p>Producto recomendado para regalo.</p>',
        tags: ['regalos', 'destacado'],
        active: true,
      };
    }
  }

  if (product) {
    if (product.image) {
      product.image = product.image
        .replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
        .replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
    }
    if (product.description) {
      product.description = product.description
        .replace(/storage\.googleapis\.com\/loveable\.appspot\.com/gi, 'media.miregalo.us/media')
        .replace(/loveable\.appspot\.com/gi, 'media.miregalo.us')
        .replace(/loveable\.(us|ai)/gi, 'miregalo.us')
        .replace(/loveable/gi, 'Miregalo');
    }
    if (product.name) {
      product.name = product.name.replace(/loveable/gi, 'Miregalo');
    }
    if (product.merchant) {
      product.merchant = product.merchant.replace(/loveable/gi, 'Miregalo Selección');
    }
  }

  return { product, post };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await resolveProduct(slug);
  const settings = await getSettings();

  if (!product) return {};

  const title = `${product.name} | ${settings.site_name}`;
  const rawDesc = stripHtml(product.description || '');
  const description = rawDesc.length > 155 ? rawDesc.slice(0, 152) + '…' : rawDesc || `Descubre ${product.name} al mejor precio en ${settings.site_name}.`;
  const canonicalUrl = `${SITE_URL}/p/${product.slug}/`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: settings.site_name,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, post } = await resolveProduct(slug);

  if (!product) {
    notFound();
  }

  const settings = await getSettings();
  const rawDesc = stripHtml(product.description || '');
  const cleanDesc = rawDesc || `Producto seleccionado por el equipo de ${settings.site_name}.`;

  // Parse price
  const priceStr = product.price || '29,99 €';
  const numericPrice = parseFloat(priceStr.replace(/[^0-9,.]/g, '').replace(',', '.')) || 29.99;
  const currency = product.currency || (priceStr.includes('€') ? 'EUR' : 'USD');

  // Related guides
  const { rows: relatedGuides } = await listPublishedPosts({ perPage: 3 });

  // Schema.org Product
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image],
    description: cleanDesc,
    brand: {
      '@type': 'Brand',
      name: product.merchant || 'Amazon España',
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/go/${product.slug}`,
      priceCurrency: currency,
      price: numericPrice.toFixed(2),
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: product.merchant || 'Amazon España',
      },
    },
  };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catálogo de Regalos',
        item: `${SITE_URL}/regalos/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${SITE_URL}/p/${product.slug}/`,
      },
    ],
  };

  return (
    <article className="product-single-page" style={{ paddingBottom: '64px' }}>
      <JsonLd data={[productSchema, breadcrumbsSchema]} />

      <Breadcrumbs
        crumbs={[
          { name: 'Catálogo de Regalos', path: '/regalos/' },
          { name: product.name },
        ]}
      />

      <div className="container" style={{ marginTop: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Media Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '100%',
                maxHeight: '480px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #f3f4f6',
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '480px',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  color: '#16a34a',
                  fontWeight: 600,
                  backgroundColor: '#f0fdf4',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                }}
              >
                ✓ En Stock • Envío Rápido
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  backgroundColor: '#f3f4f6',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                }}
              >
                🏷️ {product.merchant || 'Tienda Oficial'}
              </span>
            </div>
          </div>

          {/* Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★★★★★</span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                  Recomendado por editores
                </span>
              </div>

              <h1
                style={{
                  fontSize: '2rem',
                  lineHeight: '1.3',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '16px',
                }}
              >
                {product.name}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <span
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: '#e11d48',
                  }}
                >
                  {priceStr}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  (Precio orientativo verificado)
                </span>
              </div>

              <div
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  color: '#374151',
                  marginBottom: '28px',
                }}
                dangerouslySetInnerHTML={{ __html: product.description || `<p>${cleanDesc}</p>` }}
              />
            </div>

            <div>
              {/* Affiliate CTA Button */}
              <a
                href={`/go/${product.slug}`}
                target="_blank"
                rel="nofollow noopener sponsored"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  padding: '16px 32px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 10px 15px -3px rgba(225, 29, 72, 0.3)',
                  transition: 'background-color 0.2s',
                  marginBottom: '16px',
                }}
              >
                <span>Ver precio y comprar en la tienda</span>
                <span aria-hidden="true">↗</span>
              </a>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  textAlign: 'center',
                  marginBottom: '24px',
                }}
              >
                * Al comprar a través de nuestros enlaces de afiliados podemos recibir una pequeña comisión sin coste extra para ti.
              </p>

              {post && (
                <div
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '10px',
                    padding: '14px 18px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#9f1239' }}>
                    📖 Este producto está destacado en nuestra guía:{' '}
                    <Link
                      href={`/${post.slug}/`}
                      style={{ fontWeight: 700, color: '#e11d48', textDecoration: 'underline' }}
                    >
                      {post.title}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Gift Guides */}
        {relatedGuides.length > 0 && (
          <section style={{ marginTop: '56px' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '24px',
              }}
            >
              Guías de regalos recomendadas
            </h2>
            <div className="grid grid-3">
              {relatedGuides.map((g) => (
                <PostCard key={g.id} post={g} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
