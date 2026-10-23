import { scanAllLiveTrends } from '@/lib/trends/social-listener';
import { db } from '@/lib/db';
import type { TrendSettings } from '@/app/api/admin/trends/route';
import { TrendsDashboardClient } from './TrendsDashboardClient';

export const metadata = {
  title: 'Social Listening & Trend Jacking News | Miregalo Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminTrendsPage() {
  const [trends, savedSettings, recentPostsRes] = await Promise.all([
    scanAllLiveTrends().catch(() => []),
    db.getSetting<TrendSettings>('trend_settings').catch(() => null),
    db.find('posts', {
      eq: { type: 'blog' },
      order: [{ field: 'published_at', asc: false }],
      limit: 15,
      select: 'id, slug, title, published_at, hero_image',
    }).catch(() => ({ rows: [] })),
  ]);

  const defaultSettings: TrendSettings = {
    autoPilotEnabled: true,
    minScoreThreshold: 70,
    maxDailyPosts: 4,
    autoSubmitIndexing: true,
  };

  const settings = { ...defaultSettings, ...(savedSettings || {}) };

  return (
    <div style={{ padding: '8px 0 40px' }}>
      <TrendsDashboardClient
        initialTrends={trends}
        initialSettings={settings}
        recentPosts={recentPostsRes.rows as any}
      />
    </div>
  );
}
