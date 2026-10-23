import { NextRequest, NextResponse } from 'next/server';
import { scanAllLiveTrends } from '@/lib/trends/social-listener';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface TrendSettings {
  autoPilotEnabled: boolean;
  minScoreThreshold: number;
  maxDailyPosts: number;
  lastRunAt?: string;
  autoSubmitIndexing: boolean;
}

const DEFAULT_TREND_SETTINGS: TrendSettings = {
  autoPilotEnabled: true,
  minScoreThreshold: 70,
  maxDailyPosts: 4,
  autoSubmitIndexing: true,
};

export async function GET() {
  try {
    const [trends, savedSettings, recentNewsPosts] = await Promise.all([
      scanAllLiveTrends(),
      db.getSetting<TrendSettings>('trend_settings'),
      db.find('posts', {
        eq: { type: 'blog' },
        order: [{ field: 'published_at', asc: false }],
        limit: 10,
        select: 'id,slug,title,status,published_at,focus_keyword,hero_image',
      }),
    ]);

    const settings = { ...DEFAULT_TREND_SETTINGS, ...(savedSettings || {}) };

    return NextResponse.json({
      success: true,
      trendsCount: trends.length,
      trends,
      settings,
      recentNewsPosts: recentNewsPosts?.rows || [],
    });
  } catch (err: any) {
    console.error('[API Trends] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = (await db.getSetting<TrendSettings>('trend_settings')) || DEFAULT_TREND_SETTINGS;
    const updated = { ...current, ...body };

    await db.setSetting('trend_settings', updated);

    return NextResponse.json({
      success: true,
      message: 'Trend settings updated successfully',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
