import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export async function testSlackConnection(
  webhookUrl: string
): Promise<{ success: boolean; channel?: string; error?: string }> {
  try {
    const cleanUrl = (webhookUrl || '').trim();
    if (!cleanUrl || (!cleanUrl.startsWith('https://hooks.slack.com/') && !cleanUrl.startsWith('https://'))) {
      return {
        success: false,
        error: 'URL không hợp lệ. Vui lòng nhập đúng Slack Incoming Webhook URL (https://hooks.slack.com/...)',
      };
    }

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🔔 *[Miregalo]* Kiểm tra kết nối Slack Webhook thành công!',
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return {
        success: false,
        error: `Slack trả về lỗi (${res.status}): ${txt || res.statusText}`,
      };
    }

    return {
      success: true,
      channel: 'Slack Webhook Connected',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToSlack(
  post: Post,
  webhookUrl: string,
  channel?: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanUrl = (webhookUrl || '').trim();
    if (!cleanUrl) {
      return {
        channel: 'slack',
        success: false,
        error: 'Thiếu Slack Webhook URL',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const imageUrl = post.hero_image || post.og_image || '';

    const payload: any = {
      text: `🎁 *${title}*\n${excerpt}\n👉 ${postUrl}`,
      attachments: [
        {
          color: '#4A154B',
          title,
          title_link: postUrl,
          text: excerpt,
          image_url: imageUrl || undefined,
          footer: 'Miregalo Social Engine',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    if (channel?.trim()) {
      payload.channel = channel.trim();
    }

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return {
        channel: 'slack',
        success: false,
        error: `Slack Webhook lỗi (${res.status}): ${txt || res.statusText}`,
        timestamp,
      };
    }

    return {
      channel: 'slack',
      success: true,
      url: postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'slack',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
