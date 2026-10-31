import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import type { Post } from '@/lib/types';
import { getSocialSettings, saveSocialSettings, sharePostToAllChannels } from './index';
import { shareToFacebook } from './facebook';
import type { FacebookBackfillState, SocialChannelId } from './types';

const LOCK_MS = 10 * 60 * 1000;

export async function buildFacebookBackfillQueue(
  intervalMinutes = 240,
  startAtDate?: Date,
  channels?: SocialChannelId[]
): Promise<{ state: FacebookBackfillState; totalPosts: number }> {
  const now = new Date();
  const effectiveStart =
    startAtDate && !Number.isNaN(startAtDate.getTime()) && startAtDate.getTime() > now.getTime()
      ? startAtDate
      : now;

  const { rows } = await db.find('posts', {
    eq: { status: 'published' },
    order: [
      { field: 'published_at', asc: true },
      { field: 'created_at', asc: true },
    ],
    select: 'id,type,published_at,created_at',
  });

  const postIds = rows
    .filter((post) => post.type === 'gift' || post.type === 'blog')
    .map((post) => post.id);

  const nextState: FacebookBackfillState = {
    status: 'scheduled',
    queue_id: randomUUID(),
    post_ids: postIds,
    cursor: 0,
    interval_minutes: intervalMinutes,
    start_at: effectiveStart.toISOString(),
    next_post_at: effectiveStart.toISOString(),
    started_at: now.toISOString(),
    last_posted_at: null,
    last_post_title: null,
    last_error: null,
    skipped_count: 0,
    lock_id: null,
    lock_until: null,
    channels: channels && channels.length > 0 ? channels : ['facebook'],
    last_channels_posted: [],
  };

  return { state: nextState, totalPosts: postIds.length };
}

export interface BackfillStepResult {
  httpStatus: number;
  body: Record<string, any>;
}

/**
 * Executes one step of the Facebook Historical Post Backfill queue (oldest -> newest)
 * if due (or immediately when forceNow === true).
 */
export async function executeFacebookBackfillStep(options?: {
  forceNow?: boolean;
}): Promise<BackfillStepResult> {
  const forceNow = Boolean(options?.forceNow);
  const settings = await getSocialSettings();
  let state = settings.facebook_backfill;
  const now = new Date();

  // If forceNow is requested and queue hasn't been initialized yet, auto-initialize it (4h default)
  if (forceNow && (!state.post_ids || state.post_ids.length === 0 || state.status === 'idle' || state.status === 'completed')) {
    const built = await buildFacebookBackfillQueue(state.interval_minutes || 240, now);
    if (built.totalPosts === 0) {
      return {
        httpStatus: 400,
        body: { status: 'idle', posted: false, error: 'Không tìm thấy bài viết đã xuất bản để đưa vào hàng đợi.' },
      };
    }
    const updated = await saveSocialSettings({ facebook_backfill: built.state });
    state = updated.facebook_backfill;
  }

  if (state.status !== 'scheduled' && !forceNow) {
    return {
      httpStatus: 200,
      body: { status: state.status, posted: false, message: 'Facebook backfill is not scheduled.' },
    };
  }

  if (!forceNow && state.next_post_at && new Date(state.next_post_at) > now) {
    return {
      httpStatus: 200,
      body: {
        status: state.status,
        posted: false,
        next_post_at: state.next_post_at,
        message: 'Waiting for the next scheduled post.',
      },
    };
  }

  if (state.lock_until && new Date(state.lock_until) > now) {
    return {
      httpStatus: 200,
      body: { status: state.status, posted: false, message: 'A backfill post is already being processed.' },
    };
  }

  const selectedChannels: SocialChannelId[] =
    Array.isArray(state.channels) && state.channels.length > 0
      ? state.channels
      : ['facebook'];

  const requiresFacebook = selectedChannels.includes('facebook');
  if (requiresFacebook && (!settings.facebook_page_id || !settings.facebook_access_token)) {
    const failedState: FacebookBackfillState = {
      ...state,
      status: 'error',
      last_error: 'Facebook Page ID hoặc Token bị thiếu. Vui lòng kiểm tra lại cấu hình Facebook Fanpage.',
      lock_id: null,
      lock_until: null,
    };
    await saveSocialSettings({ facebook_backfill: failedState });
    return {
      httpStatus: 409,
      body: { status: 'error', posted: false, error: failedState.last_error },
    };
  }

  const lockId = randomUUID();
  const activeStatus = state.status === 'paused' || state.status === 'error' ? 'scheduled' : state.status;
  await saveSocialSettings({
    facebook_backfill: {
      ...state,
      status: activeStatus,
      lock_id: lockId,
      lock_until: new Date(now.getTime() + LOCK_MS).toISOString(),
    },
  });

  // Re-read after saving the lease so concurrent cron invocations cannot double-post
  const lockedSettings = await getSocialSettings();
  const lockedState = lockedSettings.facebook_backfill;
  if (lockedState.queue_id !== state.queue_id || lockedState.lock_id !== lockId) {
    return {
      httpStatus: 200,
      body: { status: lockedState.status, posted: false, message: 'Backfill queue changed while acquiring its lock.' },
    };
  }

  let cursor = lockedState.cursor;
  let skippedCount = lockedState.skipped_count;
  let post: Post | null = null;
  while (cursor < lockedState.post_ids.length) {
    const candidate = await db.findOne('posts', { id: lockedState.post_ids[cursor] });
    const hasImage = Boolean(
      candidate &&
        (candidate.hero_image ||
          candidate.og_image ||
          candidate.items?.some((it: any) => it?.image) ||
          /<img[^>]+src=/i.test(candidate.content_html || ''))
    );
    if (
      candidate &&
      candidate.status === 'published' &&
      (candidate.type === 'gift' || candidate.type === 'blog') &&
      hasImage
    ) {
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
    return {
      httpStatus: 200,
      body: {
        status: 'completed',
        posted: false,
        total_posted: completedState.cursor - completedState.skipped_count,
        skipped: skippedCount,
      },
    };
  }

  const multi = await sharePostToAllChannels(post, {
    forceChannels: selectedChannels,
    ignoreGlobalToggle: true,
  });

  const latest = await getSocialSettings();
  const latestState = latest.facebook_backfill;
  if (latestState.queue_id !== lockedState.queue_id || latestState.lock_id !== lockId) {
    return {
      httpStatus: 409,
      body: {
        status: latestState.status,
        posted: false,
        message: 'Queue changed during publishing; result was not applied to the new queue.',
      },
    };
  }

  const resultsList = Object.values(multi.results);
  const succeeded = resultsList.filter((r) => r.success).map((r) => r.channel);
  const failed = resultsList.filter((r) => !r.success).map((r) => `${r.channel}: ${r.error || 'Failed'}`);

  if (succeeded.length === 0) {
    const errorState: FacebookBackfillState = {
      ...latestState,
      status: latestState.status === 'paused' ? 'paused' : 'error',
      cursor,
      skipped_count: skippedCount,
      next_post_at: null,
      last_error: failed.join(' | ') || 'Không thể đăng lên các mạng xã hội đã chọn.',
      lock_id: null,
      lock_until: null,
    };
    await saveSocialSettings({ facebook_backfill: errorState });
    return {
      httpStatus: 502,
      body: {
        status: errorState.status,
        posted: false,
        error: errorState.last_error,
        post_id: post.id,
        state: errorState,
      },
    };
  }

  const nextCursor = cursor + 1;
  const isComplete = nextCursor >= lockedState.post_ids.length;
  const pausedDuringPublish = latestState.status === 'paused';
  const postedAt = new Date().toISOString();
  const intervalMs = (lockedState.interval_minutes || 240) * 60 * 1000;
  const successState: FacebookBackfillState = {
    ...latestState,
    status: pausedDuringPublish ? 'paused' : isComplete ? 'completed' : 'scheduled',
    cursor: nextCursor,
    skipped_count: skippedCount,
    next_post_at: pausedDuringPublish || isComplete ? null : new Date(Date.now() + intervalMs).toISOString(),
    last_posted_at: postedAt,
    last_post_title: post.title,
    last_error: failed.length > 0 ? `Đã đăng: ${succeeded.join(', ')} (Lỗi: ${failed.join(', ')})` : null,
    last_channels_posted: succeeded,
    lock_id: null,
    lock_until: null,
  };
  await saveSocialSettings({ facebook_backfill: successState });

  return {
    httpStatus: 200,
    body: {
      success: true,
      status: successState.status,
      posted: true,
      post_id: post.id,
      post_title: post.title,
      post_slug: post.slug,
      facebook_post_id: multi.results.facebook?.post_id,
      facebook_url: multi.results.facebook?.url || null,
      succeeded_channels: succeeded,
      failed_channels: failed,
      multi_report: multi,
      next_post_at: successState.next_post_at,
      cursor: nextCursor,
      total_posts: lockedState.post_ids.length,
      skipped_count: skippedCount,
      state: successState,
    },
  };
}
