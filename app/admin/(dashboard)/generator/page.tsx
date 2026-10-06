import { db } from '@/lib/db';
import { GeneratorClient } from './GeneratorClient';
import type { Keyword } from '@/lib/types';

export default async function GeneratorPage() {
  const [
    { rows: categories },
    { rows: authors },
    { rows: sampleKeywords, total: totalPlanned },
  ] = await Promise.all([
    db.find('categories', { order: [{ field: 'name' }] }),
    db.find('authors', { order: [{ field: 'name' }] }),
    db.find('keywords', {
      eq: { status: 'planned' },
      order: [{ field: 'priority' }, { field: 'volume', asc: false }],
      limit: 20,
    }),
  ]);

  const hasGeminiKey = !!process.env.GEMINI_API_KEY?.trim();

  return (
    <GeneratorClient
      categories={categories}
      authors={authors}
      sampleKeywords={sampleKeywords as Keyword[]}
      totalPlanned={totalPlanned}
      hasGeminiKey={hasGeminiKey}
    />
  );
}
