import { db } from '@/lib/db';
import { KeywordExplorer } from './KeywordExplorer';

export default async function AdminKeywordsPage() {
  const keywordsRes = await db.find('keywords', {
    limit: 50,
    order: [{ field: 'priority', asc: false }, { field: 'keyword' }],
  });

  return <KeywordExplorer initialKeywords={keywordsRes.rows} total={keywordsRes.total} />;
}
