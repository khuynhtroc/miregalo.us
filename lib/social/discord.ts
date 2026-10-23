import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

/**
 * Tests Discord Channel Webhook URL by querying webhook metadata.
 */
export async function testDiscordConnection(
  webhookUrl: string
): Promise<{ success: boolean; channel_name?: string; error?: string }> {
  try {
    const cleanUrl = (webhookUrl || '').trim();
    if (!cleanUrl || !cleanUrl.startsWith('https://discord.com/api/webhooks/') && !cleanUrl.startsWith('https://discordapp.com/api/webhooks/')) {
      return {
        success: false,
        error: 'URL không hợp lệ. Hãy dán đúng Discord Webhook URL (https://discord.com/api/webhooks/...)',
      };
    }

    const res = await fetch(cleanUrl);
    const data = await res.json();
    if (!res.ok || !data?.id) {
      return {
        success: false,
        error: data?.message || 'Discord Webhook không tồn tại hoặc đã bị xóa.',
      };
    }

    return {
      success: true,
      channel_name: data.name || `Channel #${data.channel_id}`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a rich embed card with large image to a Discord Channel via Webhook.
 */
export async function shareToDiscord(
  post: Post,
  webhookUrl: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanUrl = (webhookUrl || '').trim();
    if (!cleanUrl) {
      return {
        channel: 'discord',
        success: false,
        error: 'Discord Webhook URL bị thiếu',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const imageUrl =
      post.og_image ||
      post.hero_image ||
      post.items?.find((it) => it?.image)?.image ||
      '';

    const embed: Record<string, any> = {
      title,
      url: postUrl,
      description: excerpt.slice(0, 350),
      color: 0xfd546c,
      footer: { text: 'Miregalo.us · Guía de Regalos' },
      timestamp,
    };
    if (imageUrl) {
      embed.image = { url: imageUrl };
    }

    const res = await fetch(`${cleanUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🎁 **${title}**\n👉 ${postUrl}`,
        embeds: [embed],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        channel: 'discord',
        success: false,
        error: errData?.message || `Discord trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    const data = await res.json().catch(() => ({}));
    return {
      channel: 'discord',
      success: true,
      post_id: data?.id ? String(data.id) : undefined,
      message: 'Đã đăng bài kèm khung ảnh lên Discord thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'discord',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
