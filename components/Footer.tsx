import Link from 'next/link';
import type { SiteSettings, Category } from '@/lib/types';

interface FooterProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Footer({ settings, categories }: FooterProps) {
  const currentYear = new Date().getFullYear().toString();
  const copyright = (settings.copyright || '© {year} Miregalo. Todos los derechos reservados.').replace('{year}', currentYear);

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
              src={settings.logo_url || '/images/miregalo-logo.png'}
              alt={settings.site_name}
              width={1720}
              height={520}
            />
          </Link>
          <p>{settings.footer_about || 'Miregalo es tu portal de referencia para encontrar regalos originales, personalizados y emotivos para cada ocasión especial.'}</p>
          <Link
            className="footer-store-link"
            href={settings.shop_url || '/regalos/'}
          >
            {settings.shop_label || 'Explorar Catálogo de Regalos'} <span aria-hidden="true">→</span>
          </Link>
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
          <span className="footer-heading">Miregalo</span>
          <Link href="/sobre-nosotros/">Sobre Nosotros</Link>
          <Link href="/contacto/">Contacto</Link>
          <Link href="/faqs/">Preguntas Frecuentes</Link>
          <Link href="/politica-de-privacidad/">Política de Privacidad</Link>
          <Link href="/terminos-y-condiciones/">Términos y Condiciones</Link>
          <Link href="/politica-de-cookies/">Política de Cookies</Link>
          <Link href="/divulgacion-de-afiliados/">Aviso de Afiliados</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>{copyright}</span>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
          <Link href="/politica-de-privacidad/">Privacidad</Link>
          <Link href="/terminos-y-condiciones/">Términos</Link>
          <Link href="/faqs/">FAQs</Link>
          <Link href="/contacto/">Contacto</Link>
          <Link href="/search/">Buscar</Link>
        </div>
        <span>{settings.footer_tagline || 'Ideas desde el corazón, hechas para compartir.'}</span>
      </div>
    </footer>
  );
}
