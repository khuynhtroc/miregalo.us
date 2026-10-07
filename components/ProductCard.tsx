import type { GiftItem } from '@/lib/types';

interface ProductCardProps {
  item: GiftItem;
  index: number;
  productSlug?: string | null;
  variant?: 'card' | 'row';
}

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ProductCard({ item, index, productSlug, variant = 'card' }: ProductCardProps) {
  const number = index + 1;
  // If we have a product slug, route via /go/{slug}/ for click tracking; otherwise check item.url
  const destUrl = productSlug
    ? `/go/${productSlug}/`
    : (item.url?.startsWith('/go/') ? item.url : '/go/amazon-regalo-destacado/');
  const buttonLabel = item.button_label || (item.merchant ? `Ver en ${item.merchant}` : 'Ver en Tienda');
  const cleanDesc = stripHtml(item.description_html);
  const imageUrl = item.image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg';

  // ─────────────────────────────────────────────────────────────
  // 1. VERTICAL CARD VARIANT (Catalog Grids)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'card') {
    return (
      <article className="product-card product-card-vertical" id={`item-${number}`}>
        {/* Media Container */}
        <div className="product-card-media">
          <span className="product-badge-number">#{number}</span>
          {item.merchant && (
            <span className="product-badge-merchant">{item.merchant}</span>
          )}

          <a
            href={destUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="product-media-link"
            tabIndex={-1}
            aria-label={`Ver ${item.heading}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={item.heading}
              className="product-img"
              width={380}
              height={380}
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>

        {/* Content Body */}
        <div className="product-card-body">
          <h3 className="product-card-title">
            <a href={destUrl} target="_blank" rel="nofollow sponsored noopener">
              {item.heading}
            </a>
          </h3>

          <div className="product-card-price-row">
            <span className="product-price">
              {item.price ? item.price : 'Consultar precio'}
            </span>
            <span className="product-status-tag">
              {item.merchant || 'Amazon'}
            </span>
          </div>

          {cleanDesc && (
            <p className="product-card-desc">
              {cleanDesc}
            </p>
          )}

          {item.pros && item.pros.length > 0 && (
            <ul className="product-card-pros">
              {item.pros.slice(0, 2).map((pro, pIdx) => (
                <li key={pIdx}>
                  <span className="pro-icon">✓</span>
                  <span>{pro.replace(/^✔️\s*/, '')}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="product-card-actions">
            <a
              href={destUrl}
              className="product-cta-btn"
              target="_blank"
              rel="nofollow sponsored noopener"
            >
              <span>{buttonLabel}</span>
              <svg
                className="cta-arrow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. HORIZONTAL ROW VARIANT (Editorial Articles)
  // ─────────────────────────────────────────────────────────────
  return (
    <article className="product-card product-card-horizontal" id={`item-${number}`}>
      <header className="product-horizontal-header">
        <span className="product-horizontal-number">#{number}</span>
        <h2 className="product-horizontal-title">
          <a href={destUrl} target="_blank" rel="nofollow sponsored noopener">
            {item.heading}
          </a>
        </h2>
      </header>

      <div className="product-horizontal-body">
        <div className="product-horizontal-media">
          <a
            href={destUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            tabIndex={-1}
            aria-label={`Ver ${item.heading}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={item.heading}
              className="product-img"
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>

        <div className="product-horizontal-content">
          <div className="product-horizontal-meta">
            {item.price && <span className="product-price">{item.price}</span>}
            {item.merchant && (
              <span className="product-merchant-pill">{item.merchant}</span>
            )}
          </div>

          {item.description_html ? (
            <div
              className="product-horizontal-desc"
              dangerouslySetInnerHTML={{ __html: item.description_html }}
            />
          ) : cleanDesc ? (
            <p className="product-horizontal-desc">{cleanDesc}</p>
          ) : null}

          {item.pros && item.pros.length > 0 && (
            <div className="product-horizontal-pros">
              <div className="pros-title">Ventajas destacadas:</div>
              <ul>
                {item.pros.map((pro, pIdx) => (
                  <li key={pIdx}>
                    <span className="pro-icon">✓</span>
                    <span>{pro.replace(/^✔️\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="product-horizontal-cta">
            <a
              href={destUrl}
              className="product-cta-btn"
              target="_blank"
              rel="nofollow sponsored noopener"
            >
              <span>{buttonLabel}</span>
              <svg
                className="cta-arrow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
