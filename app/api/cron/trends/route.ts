import { NextRequest, NextResponse } from 'next/server';
import { scanAllLiveTrends } from '@/lib/trends/social-listener';
import { generateTrendingNewsArticle } from '@/lib/trends/news-generator';
import { db } from '@/lib/db';
import type { TrendSettings } from '@/app/api/admin/trends/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  return handleCronTrends(req);
}

export async function POST(req: NextRequest) {
  return handleCronTrends(req);
}

async function handleCronTrends(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  // 1. Fetch settings
  const settings = (await db.getSetting<TrendSettings>('trend_settings')) || {
    autoPilotEnabled: true,
    minScoreThreshold: 70,
    maxDailyPosts: 4,
    autoSubmitIndexing: true,
  };

  if (!settings.autoPilotEnabled && !force) {
    return NextResponse.json({
      message: 'Auto-pilot is disabled in settings. Skipping automatic generation.',
      time: new Date().toISOString(),
    });
  }

  // 2. Check daily posting quota
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { rows: todayPosts } = await db.find('posts', {
    eq: { type: 'blog' },
    limit: 20,
    order: [{ field: 'published_at', asc: false }],
  });

  const postsCreatedToday = todayPosts.filter((p: any) => {
    return p.published_at && new Date(p.published_at).getTime() >= startOfDay.getTime();
  });

  if (postsCreatedToday.length >= settings.maxDailyPosts && !force) {
    return NextResponse.json({
      message: `Daily quota of ${settings.maxDailyPosts} trending news posts already reached for today.`,
      postsToday: postsCreatedToday.length,
      time: new Date().toISOString(),
    });
  }

  // 3. Scan live trends across channels
  const liveTrends = await scanAllLiveTrends();

  // 4. Find the best candidate: score >= threshold AND not already published
  const existingSlugs = new Set((todayPosts || []).map((p: any) => p.slug));

  let candidate: any = null;
  for (const t of liveTrends) {
    if (t.score < settings.minScoreThreshold && !force) continue;
    const testSlug = t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (existingSlugs.has(testSlug)) continue;
    candidate = t;
    break;
  }

  if (!candidate) {
    return NextResponse.json({
      message: 'No qualifying trends above score threshold to publish at this time.',
      threshold: settings.minScoreThreshold,
      topTrendScore: liveTrends[0]?.score || 0,
      time: new Date().toISOString(),
    });
  }

  // 5. Generate and publish trending news post
  console.log(`[Cron Trends] Auto-Pilot triggering article for: "${candidate.topic}" (Score: ${candidate.score})`);
  const result = await generateTrendingNewsArticle(candidate);

  // Update last run in settings
  await db.setSetting('trend_settings', {
    ...settings,
    lastRunAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: 'Auto-Pilot successfully published trending news article!',
    candidateTopic: candidate.topic,
    score: candidate.score,
    result,
  });
}
