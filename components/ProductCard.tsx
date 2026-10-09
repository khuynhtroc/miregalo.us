import type { GiftItem } from '@/lib/types';
import { slugify } from '@/lib/urls';

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
  // Smart destination URL resolver:
  // 1. Explicit productSlug -> /go/${productSlug}/
  // 2. item.url if it already points to /go/
  // 3. Generate clean slug from item.heading -> /go/${slugify(item.heading)}/
  // 4. item.url if it is a valid external URL (not '#')
  // 5. Fallback to /go/item-${number}/
  let destUrl: string;
  if (productSlug) {
    destUrl = `/go/${productSlug}/`;
  } else if (item.url && item.url.startsWith('/go/')) {
    destUrl = item.url;
  } else if (item.heading) {
    destUrl = `/go/${slugify(item.heading)}/`;
  } else if (item.url && item.url.startsWith('http') && !item.url.includes('#')) {
    destUrl = item.url;
  } else {
    destUrl = `/go/item-${number}/`;
  }
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
        <div className="product-card-media" style={{ position: 'relative' }}>
          <span className="product-badge-number">#{number}</span>
          {item.merchant && (
            <span className="product-badge-merchant">{item.merchant}</span>
          )}
          <a
            href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent('https://www.miregalo.us' + destUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(item.heading)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Guardar en Pinterest"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#e60023',
              color: '#fff',
              borderRadius: '16px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 3,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
            </svg>
            <span>Pin</span>
          </a>

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
        <div className="product-horizontal-media" style={{ position: 'relative' }}>
          <a
            href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent('https://www.miregalo.us' + destUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(item.heading)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Guardar en Pinterest"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#e60023',
              color: '#fff',
              borderRadius: '16px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 3,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
            </svg>
            <span>Pin</span>
          </a>
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
