import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface VkCredentials {
  accessToken?: string;
  ownerId?: string;
  webhookUrl?: string;
}

export async function testVkConnection(
  creds: VkCredentials
): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, name: 'Webhook endpoint' };
    }

    const { accessToken } = creds;
    if (!accessToken) {
      return { success: false, error: 'Vui lòng cung cấp VK Access Token hoặc Webhook URL' };
    }

    const res = await fetch(`https://api.vk.com/method/users.get?access_token=${accessToken.trim()}&v=5.131`);
    const data = await res.json().catch(() => ({}));

    if (data?.error) {
      return { success: false, error: data.error.error_msg || 'Token VK không hợp lệ' };
    }

    const user = data?.response?.[0];
    return {
      success: true,
      name: user ? `${user.first_name} ${user.last_name}` : 'VK Account',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToVk(
  post: Post,
  creds: VkCredentials,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const imageUrl = post.hero_image || post.og_image || '';

    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'vk',
          title,
          url: postUrl,
          excerpt,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'vk',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    const { accessToken, ownerId } = creds;
    if (!accessToken) {
      return {
        channel: 'vk',
        success: false,
        error: 'Thiếu VK Access Token',
        timestamp,
      };
    }

    const message = `🎁 ${title}\n\n${excerpt}\n\n👉 ${postUrl}`;
    const params = new URLSearchParams({
      message,
      attachments: postUrl,
      access_token: accessToken.trim(),
      v: '5.131',
    });

    if (ownerId?.trim()) {
      params.append('owner_id', ownerId.trim());
    }

    const res = await fetch('https://api.vk.com/method/wall.post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (data?.error) {
      return {
        channel: 'vk',
        success: false,
        error: data.error.error_msg || 'Lỗi đăng bài VK',
        timestamp,
      };
    }

    const postId = data?.response?.post_id;
    return {
      channel: 'vk',
      success: true,
      post_id: String(postId || ''),
      url: postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'vk',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
