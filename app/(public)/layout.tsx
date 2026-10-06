import { getSettings, getCategories } from '@/lib/repo';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header settings={settings} categories={categories} />
      <main id="main-content">{children}</main>
      <Footer settings={settings} categories={categories} />
    </>
  );
}
