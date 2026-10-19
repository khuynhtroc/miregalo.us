import { db } from '@/lib/db';
import type { GoogleIndexingSettings } from '@/lib/indexing/google';
import { getIndexingSettings, getIndexingLogs } from '@/lib/indexing/google';
import { SITE_URL } from '@/lib/urls';
import { IndexingManager } from './IndexingManager';

export const metadata = {
  title: 'Google Auto Indexing & Push API | Admin',
};

export default async function AdminIndexingPage() {
  const [rawSettings, logs, postsRes, catsRes] = await Promise.all([
    getIndexingSettings().catch(
      (): GoogleIndexingSettings => ({
        enabled: true,
        auto_submit_on_publish: true,
        ping_sitemap: true,
        ping_indexnow: false,
        client_email: '',
        private_key: '',
      })
    ),
    getIndexingLogs().catch(() => []),
    db.find('posts', {
      eq: { status: 'published' },
      select: 'id, slug, title, published_at',
      order: [{ field: 'published_at', asc: false }],
      limit: 20,
    }).catch(() => ({ rows: [] })),
    db.find('categories', {
      select: 'id, slug, name',
      order: [{ field: 'name', asc: true }],
      limit: 50,
    }).catch(() => ({ rows: [] })),
  ]);

  const hasPrivateKey = Boolean(rawSettings.private_key);
  const safeSettings = {
    ...rawSettings,
    private_key: hasPrivateKey ? '•••••••• [Configured RSA Private Key] ••••••••' : '',
    has_private_key: hasPrivateKey,
  };

  return (
    <div style={{ padding: '8px 0 40px' }}>
      <IndexingManager
        initialSettings={safeSettings}
        initialLogs={logs}
        recentPosts={postsRes.rows as any}
        categories={catsRes.rows as any}
        siteUrl={SITE_URL}
      />
    </div>
  );
}
