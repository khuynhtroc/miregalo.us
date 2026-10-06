import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateContent } from '@/lib/ai/content-generator';
import type { Keyword } from '@/lib/types';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { count = 5, cluster, publish = true } = await req.json().catch(() => ({}));

    // Find planned keywords
    const limit = Math.min(Math.max(count, 1), 20); // max 20 per batch request
    const eq: Record<string, string> = { status: 'planned' };
    if (cluster) eq.cluster = cluster;

    const { rows: keywords } = await db.find('keywords', {
      eq,
      order: [{ field: 'priority' }, { field: 'volume', asc: false }],
      limit,
    });

    if (keywords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No planned keywords found for generation',
        generated: [],
      });
    }

    const generated = [];

    for (const kw of keywords as Keyword[]) {
      try {
        const slug = kw.target_path.replace(/^\/+|\/+$/g, '');
        const res = await generateContent({
          keyword: kw.keyword,
          target_slug: slug,
          post_type: kw.post_type,
          publish,
        });

        generated.push({
          keyword: kw.keyword,
          slug,
          title: res.post.title,
          source: res.source,
          id: res.post.id,
        });
      } catch (genErr) {
        console.error(`Failed to generate post for keyword ${kw.keyword}:`, genErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: generated.length,
      generated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown batch error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
