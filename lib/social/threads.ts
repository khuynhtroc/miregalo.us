import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const THREADS_API = 'https://graph.threads.net/v1.0';

/**
 * Verifies Meta Threads User ID and Access Token.
 */
export async function testThreadsConnection(
  userId: string,
  accessToken: string
): Promise<{ success: boolean; username?: string; user_id?: string; error?: string }> {
  try {
    const cleanToken = (accessToken || '').trim();
    if (!cleanToken) {
      return { success: false, error: 'Vui lòng nhập Threads Access Token' };
    }

    const target = (userId || '').trim() || 'me';
    const res = await fetch(
      `${THREADS_API}/${encodeURIComponent(target)}?fields=id,username,name&access_token=${encodeURIComponent(cleanToken)}`
    );
    const data = await res.json();
    if (!res.ok || !data?.id) {
      return {
        success: false,
        error: data?.error?.message || 'Không thể xác thực tài khoản Threads. Kiểm tra lại Threads Access Token.',
      };
    }

    return {
      success: true,
      username: data.username || data.name || data.id,
      user_id: String(data.id),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a post with link attachment to Meta Threads.
 */
export async function shareToThreads(
  post: Post,
  userId: string,
  accessToken: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanToken = (accessToken || '').trim();
    if (!cleanToken) {
      return {
        channel: 'threads',
        success: false,
        error: 'Threads Access Token bị thiếu',
        timestamp,
      };
    }

    let cleanUserId = (userId || '').trim();
    if (!cleanUserId) {
      const meRes = await fetch(`${THREADS_API}/me?fields=id&access_token=${encodeURIComponent(cleanToken)}`);
      const meData = await meRes.json();
      if (meRes.ok && meData?.id) {
        cleanUserId = String(meData.id);
      } else {
        return {
          channel: 'threads',
          success: false,
          error: 'Không xác định được Threads User ID từ Access Token',
          timestamp,
        };
      }
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';

    let text = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n👉 ${postUrl}`;

    if (text.length > 490) {
      text = `🎁 ${title.slice(0, 200)}...\n\n👉 ${postUrl}`;
    }

    // 1. Create media container with link_attachment
    const createParams = new URLSearchParams({
      media_type: 'TEXT',
      text,
      link_attachment: postUrl,
      access_token: cleanToken,
    });
    const createRes = await fetch(`${THREADS_API}/${cleanUserId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createParams.toString(),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData?.id) {
      return {
        channel: 'threads',
        success: false,
        error: createData?.error?.message || 'Không thể tạo bài đăng trên Threads',
        timestamp,
      };
    }

    // 2. Publish the container
    const pubParams = new URLSearchParams({
      creation_id: String(createData.id),
      access_token: cleanToken,
    });
    const pubRes = await fetch(`${THREADS_API}/${cleanUserId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: pubParams.toString(),
    });
    const pubData = await pubRes.json();
    if (!pubRes.ok || !pubData?.id) {
      return {
        channel: 'threads',
        success: false,
        error: pubData?.error?.message || 'Không thể xuất bản bài đăng trên Threads',
        timestamp,
      };
    }

    return {
      channel: 'threads',
      success: true,
      post_id: String(pubData.id),
      url: `https://www.threads.net`,
      message: 'Đã đăng bài lên Threads thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'threads',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
