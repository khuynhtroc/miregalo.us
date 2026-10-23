import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

/**
 * Normalizes Mastodon instance base URL (defaults to https://mastodon.social)
 */
function normalizeInstance(instanceUrl?: string): string {
  const raw = (instanceUrl || 'https://mastodon.social').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

/**
 * Verifies Mastodon Access Token and returns account username.
 */
export async function testMastodonConnection(
  instanceUrl: string,
  accessToken: string
): Promise<{ success: boolean; username?: string; instance?: string; error?: string }> {
  try {
    const baseUrl = normalizeInstance(instanceUrl);
    const cleanToken = (accessToken || '').trim();
    if (!cleanToken) {
      return { success: false, error: 'Vui lòng nhập Mastodon Access Token' };
    }

    const res = await fetch(`${baseUrl}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data?.username) {
      return {
        success: false,
        error: data?.error || 'Mastodon Access Token không hợp lệ.',
      };
    }

    return {
      success: true,
      username: `@${data.username}`,
      instance: baseUrl.replace(/^https?:\/\//, ''),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a public status with OpenGraph Link Card to Mastodon.
 */
export async function shareToMastodon(
  post: Post,
  instanceUrl: string,
  accessToken: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const baseUrl = normalizeInstance(instanceUrl);
    const cleanToken = (accessToken || '').trim();
    if (!cleanToken) {
      return {
        channel: 'mastodon',
        success: false,
        error: 'Mastodon Access Token bị thiếu',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';

    let statusText = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n${excerpt}\n\n👉 ${postUrl}\n\n#regalos #ideaspararegalar #miregalo`;

    if (statusText.length > 490) {
      statusText = `🎁 ${title.slice(0, 180)}\n\n👉 ${postUrl}\n\n#regalos #miregalo`;
    }

    const res = await fetch(`${baseUrl}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({
        status: statusText,
        visibility: 'public',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.id) {
      return {
        channel: 'mastodon',
        success: false,
        error: data?.error || 'Không thể đăng bài lên Mastodon',
        timestamp,
      };
    }

    return {
      channel: 'mastodon',
      success: true,
      post_id: String(data.id),
      url: data.url || `${baseUrl}/@${data.account?.username}/${data.id}`,
      message: 'Đã đăng bài lên Mastodon thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'mastodon',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
