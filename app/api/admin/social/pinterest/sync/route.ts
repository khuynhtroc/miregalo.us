import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  syncUnpinnedPostsToPinterest,
  getPinterestSyncState,
  getPinterestToken,
} from '@/lib/social/pinterest';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = await getPinterestToken();
    const [postsRes, syncState] = await Promise.all([
      db.find('posts', { eq: { status: 'published' }, limit: 2000 }),
      getPinterestSyncState(),
    ]);

    const publishedTotal = postsRes.rows.length;
    const pinnedSet = new Set(syncState.pinned_post_ids || []);
    const totalPinned = pinnedSet.size;
    const remaining = Math.max(0, publishedTotal - totalPinned);

    return NextResponse.json({
      configured: Boolean(token),
      total_published: publishedTotal,
      total_pinned: totalPinned,
      remaining,
      last_sync_at: syncState.last_sync_at || null,
      recent_history: (syncState.history || []).slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let limit = 5;
    try {
      const body = await req.json();
      if (body?.limit && Number.isInteger(body.limit)) {
        limit = Math.min(Math.max(1, body.limit), 20);
      }
    } catch {}

    const result = await syncUnpinnedPostsToPinterest(limit);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
