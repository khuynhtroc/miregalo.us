import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

/**
 * Triggers an external Webhook (Make.com, Zapier, n8n, etc.) when a post is published
 */
export async function triggerSocialWebhook(
  post: Post,
  webhookUrl: string,
  secret?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      return {
        channel: 'webhook',
        success: false,
        error: 'Chưa cấu hình Webhook URL',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const payload = {
      event: 'post.published',
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: postUrl,
        excerpt: post.excerpt,
        seo_description: post.seo_description,
        hero_image: post.hero_image,
        items_count: post.items?.length || 0,
        published_at: post.published_at || timestamp,
      },
      site: {
        name: 'Miregalo',
        url: SITE_URL,
      },
      timestamp,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Miregalo-SocialBot/1.0',
    };
    if (secret) {
      headers['X-Miregalo-Secret'] = secret.trim();
    }

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        channel: 'webhook',
        success: false,
        error: `Webhook phản hồi lỗi HTTP ${res.status}: ${errText.slice(0, 100)}`,
        timestamp,
      };
    }

    return {
      channel: 'webhook',
      success: true,
      url: cleanUrl,
      message: 'Đã gửi payload bài viết tới Webhook thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'webhook',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}

/**
 * Sends a test ping payload to verify the Webhook URL
 */
export async function testSocialWebhook(
  webhookUrl: string,
  secret?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      return { success: false, error: 'Chưa điền Webhook URL' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Miregalo-SocialBot/1.0',
    };
    if (secret) {
      headers['X-Miregalo-Secret'] = secret.trim();
    }

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'test.ping',
        message: 'Kiểm tra kết nối từ Miregalo Social Auto-Share thành công!',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook trả về lỗi HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
