import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSocialSettings, saveSocialSettings } from '@/lib/social';
import type { FacebookBackfillState } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

const ALLOWED_INTERVALS = new Set([60, 180, 360, 720, 1440]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, interval_minutes, start_at } = await req.json();
    const settings = await getSocialSettings();
    const current = settings.facebook_backfill;
    const now = new Date();

    if (action === 'start') {
      if (current.status === 'scheduled' || (current.lock_until && new Date(current.lock_until) > now)) {
        return NextResponse.json({ error: 'Hàng đợi đang chạy hoặc đang xử lý một bài. Hãy tạm dừng trước khi tạo hàng đợi mới.' }, { status: 409 });
      }
      if (current.status === 'paused' || current.status === 'error') {
        return NextResponse.json({ error: 'Hàng đợi đang tạm dừng hoặc bị lỗi. Hãy tiếp tục hàng đợi hiện tại hoặc xóa nó trước.' }, { status: 409 });
      }
      if (!settings.facebook_page_id || !settings.facebook_access_token) {
        return NextResponse.json({ error: 'Nhập Page ID và Page Access Token rồi lưu cấu hình trước khi tạo hàng đợi bài cũ.' }, { status: 400 });
      }
      const interval = Number(interval_minutes);
      if (!ALLOWED_INTERVALS.has(interval)) {
        return NextResponse.json({ error: 'Khoảng cách đăng không hợp lệ.' }, { status: 400 });
      }
      const firstPostAt = new Date(start_at);
      if (!start_at || Number.isNaN(firstPostAt.getTime())) {
        return NextResponse.json({ error: 'Chọn thời điểm bắt đầu hợp lệ.' }, { status: 400 });
      }
      if (firstPostAt.getTime() < now.getTime()) {
        return NextResponse.json({ error: 'Thời điểm bắt đầu cần ở hiện tại hoặc trong tương lai.' }, { status: 400 });
      }

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

      if (!postIds.length) {
        return NextResponse.json({ error: 'Không tìm thấy bài viết đã xuất bản để đưa vào hàng đợi.' }, { status: 400 });
      }

      const nextState: FacebookBackfillState = {
        status: 'scheduled',
        queue_id: randomUUID(),
        post_ids: postIds,
        cursor: 0,
        interval_minutes: interval,
        start_at: firstPostAt.toISOString(),
        next_post_at: firstPostAt.toISOString(),
        started_at: now.toISOString(),
        last_posted_at: null,
        last_post_title: null,
        last_error: null,
        skipped_count: 0,
        lock_id: null,
        lock_until: null,
      };

      const updated = await saveSocialSettings({ facebook_backfill: nextState });
      return NextResponse.json({ success: true, state: updated.facebook_backfill, total_posts: postIds.length });
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
      const retryAt = current.next_post_at && new Date(current.next_post_at) > now
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
        return NextResponse.json({ error: 'Đang gửi một bài lên Facebook. Hãy đợi thao tác này hoàn tất rồi thử lại.' }, { status: 409 });
      }
      const updated = await saveSocialSettings({
        facebook_backfill: { ...settings.facebook_backfill, status: 'idle', queue_id: null, post_ids: [], cursor: 0, start_at: null, next_post_at: null, started_at: null, last_posted_at: null, last_post_title: null, last_error: null, skipped_count: 0, lock_id: null, lock_until: null },
      });
      return NextResponse.json({ success: true, state: updated.facebook_backfill });
    }

    return NextResponse.json({ error: 'Thao tác không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
