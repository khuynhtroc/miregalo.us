import type { GiftItem } from '@/lib/types';

interface ProductCardProps {
  item: GiftItem;
  index: number;
  productSlug?: string | null;
}

export function ProductCard({ item, index, productSlug }: ProductCardProps) {
  const number = index + 1;
  // If we have a product slug, route via /go/{slug}/ for click tracking; otherwise check item.url
  const destUrl = productSlug
    ? `/go/${productSlug}/`
    : (item.url?.startsWith('/go/') ? item.url : '/go/amazon-regalo-destacado/');
  const buttonLabel = item.button_label || 'Ver en Tienda';

  return (
    <div className="product-item-row row product-card" id={`item-${number}`}>
      <div className="col-sm-12">
        <h2 className="ml2 mt2 item-heading" id={`item-heading-${number}`}>
          <a href={destUrl} target="_blank" rel="nofollow sponsored noopener">
            <span className="item-number">{number}</span>
            <span className="item-title">{item.heading}</span>
          </a>
        </h2>
      </div>

      <div className="col-sm-12 col-lg-6 mb2 mt2 fixed-container">
        <a href={destUrl} target="_blank" rel="nofollow sponsored noopener">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image || 'https://storage.googleapis.com/loveable.appspot.com/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg'}
            alt={item.heading}
            className="contain"
            width={400}
            height={400}
            style={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'contain' }}
            loading="lazy"
            decoding="async"
          />
        </a>
      </div>

      <div className="col-sm-12 col-lg-6 flex flex-column">
        <div className="item-content pl3 order-2 order-md-1">
          {item.description_html ? (
            <div dangerouslySetInnerHTML={{ __html: item.description_html }} />
          ) : null}

          {item.pros && item.pros.length > 0 && (
            <>
              <p><strong>Ventajas:</strong></p>
              {item.pros.map((pro, pIdx) => (
                <p key={pIdx}>✔️ {pro.replace(/^✔️\s*/, '')}</p>
              ))}
            </>
          )}

          {item.price && (
            <p className="item-price" style={{ marginTop: '10px', fontWeight: 'bold' }}>
              Precio: {item.price} {item.merchant ? `• ${item.merchant}` : ''}
            </p>
          )}
        </div>

        <div className="flex justify-center flexwrap order-1 order-md-2 mt-3">
          <a
            href={destUrl}
            className="ampstart-btn btn-full btn-full-width buy-now-btn mb1"
            target="_blank"
            rel="nofollow sponsored noopener"
          >
            {buttonLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
