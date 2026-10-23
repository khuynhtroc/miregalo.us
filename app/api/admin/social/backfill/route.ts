import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getSocialSettings,
  saveSocialSettings,
  buildFacebookBackfillQueue,
  executeFacebookBackfillStep,
} from '@/lib/social';

export const dynamic = 'force-dynamic';

const ALLOWED_INTERVALS = new Set([30, 60, 120, 180, 240, 360, 480, 720, 1440]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, interval_minutes, start_at, post_immediately } = await req.json();
    const settings = await getSocialSettings();
    const current = settings.facebook_backfill;
    const now = new Date();

    if (action === 'start') {
      if (current.lock_until && new Date(current.lock_until) > now) {
        return NextResponse.json(
          { error: 'Hàng đợi đang xử lý một bài. Hãy đợi giây lát rồi thử lại.' },
          { status: 409 }
        );
      }
      if (!settings.facebook_page_id || !settings.facebook_access_token) {
        return NextResponse.json(
          { error: 'Nhập Page ID và Page Access Token rồi lưu cấu hình trước khi tạo hàng đợi bài cũ.' },
          { status: 400 }
        );
      }
      const interval = ALLOWED_INTERVALS.has(Number(interval_minutes)) ? Number(interval_minutes) : 240;
      const parsedStart = start_at ? new Date(start_at) : now;
      const startAtDate = !Number.isNaN(parsedStart.getTime()) ? parsedStart : now;
      const shouldPostImmediately =
        Boolean(post_immediately) || startAtDate.getTime() <= now.getTime() + 60 * 1000;

      const { state: nextState, totalPosts } = await buildFacebookBackfillQueue(interval, startAtDate);
      if (!totalPosts) {
        return NextResponse.json(
          { error: 'Không tìm thấy bài viết đã xuất bản để đưa vào hàng đợi.' },
          { status: 400 }
        );
      }

      const updated = await saveSocialSettings({ facebook_backfill: nextState });

      if (shouldPostImmediately) {
        const step = await executeFacebookBackfillStep({ forceNow: true });
        const latest = await getSocialSettings();
        return NextResponse.json({
          success: true,
          state: latest.facebook_backfill,
          total_posts: totalPosts,
          posted_first: step.body.posted === true,
          first_post_title: step.body.post_title || null,
          facebook_url: step.body.facebook_url || null,
          step_error: step.body.error || null,
        });
      }

      return NextResponse.json({
        success: true,
        state: updated.facebook_backfill,
        total_posts: totalPosts,
      });
    }

    if (action === 'post_now') {
      if (!settings.facebook_page_id || !settings.facebook_access_token) {
        return NextResponse.json(
          { error: 'Nhập Page ID và Page Access Token hợp lệ trước khi đăng bài.' },
          { status: 400 }
        );
      }
      const step = await executeFacebookBackfillStep({ forceNow: true });
      const latest = await getSocialSettings();
      if (step.httpStatus >= 400 || !step.body.posted) {
        return NextResponse.json(
          {
            error: step.body.error || step.body.message || 'Không thể đăng bài tiếp theo lên Fanpage.',
            state: latest.facebook_backfill,
          },
          { status: step.httpStatus >= 400 ? step.httpStatus : 400 }
        );
      }
      return NextResponse.json({
        success: true,
        posted: true,
        post_title: step.body.post_title,
        facebook_url: step.body.facebook_url,
        state: latest.facebook_backfill,
      });
    }

    if (action === 'pause') {
      if (current.status !== 'scheduled') {
        return NextResponse.json({ error: 'Chỉ có thể tạm dừng hàng đợi đang chạy.' }, { status: 400 });
      }
      const updated = await saveSocialSettings({
        facebook_backfill: { ...current, status: 'paused' },
      });
      return NextResponse.json({ success: true, state: updated.facebook_backfill });
    }

    if (action === 'resume') {
      if (current.status !== 'paused' && current.status !== 'error') {
        return NextResponse.json({ error: 'Hàng đợi hiện không ở trạng thái tạm dừng hoặc lỗi.' }, { status: 400 });
      }
      const retryAt =
        current.next_post_at && new Date(current.next_post_at) > now
          ? current.next_post_at
          : now.toISOString();
      const updated = await saveSocialSettings({
        facebook_backfill: {
          ...current,
          status: 'scheduled',
          next_post_at: retryAt,
          last_error: null,
          lock_id: null,
          lock_until: null,
        },
      });
      return NextResponse.json({ success: true, state: updated.facebook_backfill });
    }

    if (action === 'reset') {
      if (current.lock_until && new Date(current.lock_until) > now) {
        return NextResponse.json(
          { error: 'Đang gửi một bài lên Facebook. Hãy đợi thao tác này hoàn tất rồi thử lại.' },
          { status: 409 }
        );
      }
      const updated = await saveSocialSettings({
        facebook_backfill: {
          ...settings.facebook_backfill,
          status: 'idle',
          queue_id: null,
          post_ids: [],
          cursor: 0,
          start_at: null,
          next_post_at: null,
          started_at: null,
          last_posted_at: null,
          last_post_title: null,
          last_error: null,
          skipped_count: 0,
          lock_id: null,
          lock_until: null,
        },
      });
      return NextResponse.json({ success: true, state: updated.facebook_backfill });
    }

    return NextResponse.json({ error: 'Thao tác không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
