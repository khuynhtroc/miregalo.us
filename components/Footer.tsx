import Link from 'next/link';
import type { SiteSettings, Category } from '@/lib/types';

interface FooterProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Footer({ settings, categories }: FooterProps) {
  const currentYear = new Date().getFullYear().toString();
  const copyright = (settings.copyright || '© {year} Loveable LLC').replace('{year}', currentYear);

  const recipients = categories.filter((c) => c.group === 'recipients' && c.show_in_footer).slice(0, 6);
  const occasions = categories.filter((c) => c.group === 'occasions' && c.show_in_footer).slice(0, 6);
  const blogCats = categories.filter((c) => c.group === 'blog' && c.show_in_footer).slice(0, 5);

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand brand-light" aria-label={`${settings.site_name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brand-logo footer-logo"
              src={settings.logo_url || '/images/loveable-logo.png'}
              alt={settings.site_name}
              width={1720}
              height={520}
            />
          </Link>
          <p>{settings.footer_about || 'Ideas y guías de regalos para cada persona, relación y momento significativo.'}</p>
          <a
            className="footer-store-link"
            href={settings.shop_url || 'https://loveable.us'}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visitar Tienda Loveable <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="footer-column">
          <Link className="footer-heading" href="/destinatarios/">
            Destinatarios
          </Link>
          {recipients.map((c) => (
            <Link key={c.id} href={`/${c.slug}/`}>
              {c.name}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <Link className="footer-heading" href="/ocasiones/">
            Ocasiones
          </Link>
          {occasions.map((c) => (
            <Link key={c.id} href={`/${c.slug}/`}>
              {c.name}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <Link className="footer-heading" href="/blog/">
            Blog
          </Link>
          {blogCats.map((c) => (
            <Link key={c.id} href={`/${c.slug}/`}>
              {c.name}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <span className="footer-heading">Explorar</span>
          <Link href="/regalos/">Catálogo de Regalos</Link>
          <Link href="/intereses/">Intereses</Link>
          <Link href="/search/">Buscar</Link>
          <Link href="/rss.xml">Canal RSS</Link>
          <a href={settings.contact_url || 'https://loveable.us/pages/contact-us'} target="_blank" rel="noopener noreferrer">
            Contacto
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>{copyright}</span>
        <span>{settings.footer_tagline || 'Ideas desde el corazón, hechas para compartir.'}</span>
      </div>
    </footer>
  );
}
