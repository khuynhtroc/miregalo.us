import type { Metadata } from 'next';
import { getSettings, getCategories } from '@/lib/repo';
import { searchPosts, type SearchResponse } from '@/lib/search';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StoreCta } from '@/components/StoreCta';
import { JsonLd } from '@/components/JsonLd';
import { SearchPageClient } from '@/components/SearchPageClient';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: 'all' | 'gift' | 'blog';
    topic?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const settings = await getSettings();
  const query = (q || '').trim();

  return buildMetadata(settings, {
    title: query
      ? `Resultados para "${query}" | ${settings.site_name}`
      : `Buscar Guías de Regalos y Artículos | ${settings.site_name}`,
    description: `Busca ideas de regalos, personas, ocasiones y artículos seleccionados en ${settings.site_name}.`,
    path: query ? `/search/?q=${encodeURIComponent(query)}` : '/search/',
    type: 'website',
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, type, topic, page } = await searchParams;
  const query = (q || '').trim();
  const pageNum = parseInt(page || '1', 10);

  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ]);

  let searchData: SearchResponse = {
    query: '',
    total: 0,
    page: 1,
    perPage: 20,
    totalPages: 0,
    rows: [],
    counts: { all: 0, gift: 0, blog: 0 },
    topics: [],
  };

  if (query) {
    try {
      searchData = await searchPosts({
        q: query,
        type: type || 'all',
        topic: topic || '',
        page: pageNum,
        perPage: 20,
      });
    } catch (err) {
      console.error('[search page] Error executing search:', err);
    }
  }

  const popularCategories = categories
    .filter((c) => c.group !== 'hub')
    .slice(0, 16);

  const breadcrumbs = [
    { name: 'Inicio', url: '/' },
    { name: 'Buscar' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <Breadcrumbs crumbs={breadcrumbs} />

      <SearchPageClient
        initialData={searchData}
        popularCategories={popularCategories}
        allCategories={categories}
        siteName={settings.site_name || 'Mi Regalo'}
        googleSearchCx={settings.google_search_cx || ''}
      />

      <StoreCta settings={settings} />
    </>
  );
}
