import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Post } from '@/lib/types';
import { getSocialSettings, saveSocialSettings, shareToFacebook } from '@/lib/social';
import type { FacebookBackfillState } from '@/lib/social/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCK_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  return runBackfill(req);
}

export async function POST(req: NextRequest) {
  return runBackfill(req);
}

async function runBackfill(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
  }

  try {
    const settings = await getSocialSettings();
    const state = settings.facebook_backfill;
    const now = new Date();

    if (state.status !== 'scheduled') {
      return NextResponse.json({ status: state.status, message: 'Facebook backfill is not scheduled.' });
    }
    if (state.next_post_at && new Date(state.next_post_at) > now) {
      return NextResponse.json({ status: state.status, next_post_at: state.next_post_at, message: 'Waiting for the next scheduled post.' });
    }
    if (state.lock_until && new Date(state.lock_until) > now) {
      return NextResponse.json({ status: state.status, message: 'A backfill post is already being processed.' });
    }
    if (!settings.facebook_page_id || !settings.facebook_access_token) {
      const failedState: FacebookBackfillState = {
        ...state,
        status: 'error',
        last_error: 'Facebook Page ID or Page Access Token is missing. Save valid credentials, then resume the queue.',
        lock_id: null,
        lock_until: null,
      };
      await saveSocialSettings({ facebook_backfill: failedState });
      return NextResponse.json({ status: 'error', error: failedState.last_error }, { status: 409 });
    }

    const lockId = randomUUID();
    await saveSocialSettings({
      facebook_backfill: {
        ...state,
        lock_id: lockId,
        lock_until: new Date(now.getTime() + LOCK_MS).toISOString(),
      },
    });

    // Re-read after saving the lease so a second cron invocation can see it before posting.
    const lockedSettings = await getSocialSettings();
    const lockedState = lockedSettings.facebook_backfill;
    if (lockedState.queue_id !== state.queue_id || lockedState.lock_id !== lockId || lockedState.status !== 'scheduled') {
      return NextResponse.json({ status: lockedState.status, message: 'Backfill queue changed while acquiring its lock.' });
    }

    let cursor = lockedState.cursor;
    let skippedCount = lockedState.skipped_count;
    let post: Post | null = null;
    while (cursor < lockedState.post_ids.length) {
      const candidate = await db.findOne('posts', { id: lockedState.post_ids[cursor] });
      if (candidate && candidate.status === 'published' && (candidate.type === 'gift' || candidate.type === 'blog')) {
        post = candidate;
        break;
      }
      cursor++;
      skippedCount++;
    }

    if (!post) {
      const completedState: FacebookBackfillState = {
        ...lockedState,
        status: 'completed',
        cursor,
        skipped_count: skippedCount,
        next_post_at: null,
        last_error: null,
        lock_id: null,
        lock_until: null,
      };
      const latest = await getSocialSettings();
      if (latest.facebook_backfill.queue_id === lockedState.queue_id && latest.facebook_backfill.lock_id === lockId) {
        await saveSocialSettings({ facebook_backfill: completedState });
      }
      return NextResponse.json({ status: 'completed', posted: completedState.cursor - completedState.skipped_count, skipped: skippedCount });
    }

    const result = await shareToFacebook(
      post,
      lockedSettings.facebook_page_id,
      lockedSettings.facebook_access_token,
      lockedSettings.facebook_template,
    );

    const latest = await getSocialSettings();
    const latestState = latest.facebook_backfill;
    if (latestState.queue_id !== lockedState.queue_id || latestState.lock_id !== lockId) {
      return NextResponse.json({ status: latestState.status, message: 'Queue changed during Facebook publishing; result was not applied to the new queue.' }, { status: 409 });
    }

    if (!result.success) {
      const errorState: FacebookBackfillState = {
        ...latestState,
        status: latestState.status === 'paused' ? 'paused' : 'error',
        cursor,
        skipped_count: skippedCount,
        next_post_at: null,
        last_error: result.error || 'Facebook did not confirm the post.',
        lock_id: null,
        lock_until: null,
      };
      await saveSocialSettings({ facebook_backfill: errorState });
      return NextResponse.json({ status: errorState.status, error: errorState.last_error, post_id: post.id }, { status: 502 });
    }

    const nextCursor = cursor + 1;
    const isComplete = nextCursor >= lockedState.post_ids.length;
    const pausedDuringPublish = latestState.status === 'paused';
    const postedAt = new Date().toISOString();
    const successState: FacebookBackfillState = {
      ...latestState,
      status: pausedDuringPublish ? 'paused' : (isComplete ? 'completed' : 'scheduled'),
      cursor: nextCursor,
      skipped_count: skippedCount,
      next_post_at: pausedDuringPublish || isComplete
        ? null
        : new Date(Date.now() + lockedState.interval_minutes * 60 * 1000).toISOString(),
      last_posted_at: postedAt,
      last_post_title: post.title,
      last_error: null,
      lock_id: null,
      lock_until: null,
    };
    await saveSocialSettings({ facebook_backfill: successState });

    return NextResponse.json({
      status: successState.status,
      posted: true,
      post_id: post.id,
      facebook_post_id: result.post_id,
      facebook_url: result.url,
      next_post_at: successState.next_post_at,
      cursor: nextCursor,
      total_posts: lockedState.post_ids.length,
      skipped_count: skippedCount,
    });
  } catch (err: any) {
    console.error('[Social Backfill] Cron failed:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
