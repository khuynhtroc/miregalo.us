import { NextRequest, NextResponse } from 'next/server';
import { generateTrendingNewsArticle } from '@/lib/trends/news-generator';
import type { TrendingItem } from '@/lib/trends/social-listener';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

export async function POST(req: NextRequest) {
  try {
    const trend: TrendingItem = await req.json();

    if (!trend || !trend.topic) {
      return NextResponse.json({ error: 'Missing topic or trend data' }, { status: 400 });
    }

    const result = await generateTrendingNewsArticle(trend);

    return NextResponse.json({
      success: true,
      message: 'Trending news article generated and published successfully!',
      result,
    });
  } catch (err: any) {
    console.error('[API Trends Generate] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
