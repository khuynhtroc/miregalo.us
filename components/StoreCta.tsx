import type { SiteSettings } from '@/lib/types';

interface StoreCtaProps {
  settings: SiteSettings;
  variant?: 'banner' | 'in-article';
}

export function StoreCta({ settings, variant = 'banner' }: StoreCtaProps) {
  const shopUrl = settings.shop_url || '/regalos/';
  const shopLabel = settings.shop_label || 'Explorar Catálogo';

  if (variant === 'in-article') {
    return (
      <aside className="article-store-cta">
        <div>
          <p className="eyebrow">{settings.cta_eyebrow || 'Hazlo significativo'}</p>
          <h2>Convierte la inspiración en un regalo inolvidable</h2>
          <p>Descubre detalles personalizados creados para las personas y los momentos que más importan.</p>
        </div>
        <a className="button" href={shopUrl} target="_blank" rel="noopener noreferrer">
          {shopLabel} <span aria-hidden="true">→</span>
        </a>
      </aside>
    );
  }

  return (
    <section className="section store-cta-section">
      <div className="container">
        <div className="store-cta">
          <div>
            <p className="eyebrow">{settings.cta_eyebrow || 'Hazlo personal'}</p>
            <h2>{settings.cta_title || '¿Encontraste la idea perfecta?'}</h2>
            <p>{settings.cta_text || 'Convierte tu inspiración en un regalo personalizado creado especialmente para ellos.'}</p>
          </div>
          <a className="button button-light" href={shopUrl} target="_blank" rel="noopener noreferrer">
            {shopLabel} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
