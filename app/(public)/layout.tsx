import { getSettings, getCategories } from '@/lib/repo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import type { Category, SiteSettings } from '@/lib/types';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ]);

  // Strip heavy HTML/SEO fields before passing to Client Components (Header/Footer)
  // to cut RSC serialization payload & Worker CPU time by ~70%
  const navCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    group: c.group,
    show_in_nav: c.show_in_nav,
    show_in_footer: c.show_in_footer,
  })) as Category[];

  const navSettings = {
    site_name: settings.site_name,
    logo_url: settings.logo_url,
    search_placeholder: settings.search_placeholder,
    shop_url: settings.shop_url,
    shop_label: settings.shop_label,
    copyright: settings.copyright,
    footer_about: settings.footer_about,
    footer_tagline: settings.footer_tagline,
  } as SiteSettings;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header settings={navSettings} categories={navCategories} />
      <main id="main-content">{children}</main>
      <Footer settings={navSettings} categories={navCategories} />
      <CookieBanner />
    </>
  );
}
