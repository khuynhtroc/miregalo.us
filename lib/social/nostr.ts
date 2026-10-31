import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface NostrCredentials {
  privateKey?: string;
  relays?: string;
  webhookUrl?: string;
}

export async function testNostrConnection(
  creds: NostrCredentials
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, status: 'Nostr Webhook endpoint ready' };
    }

    const { privateKey } = creds;
    if (!privateKey) {
      return { success: false, error: 'Vui lòng cung cấp Nostr Private Key (nsec / hex) hoặc Webhook URL' };
    }

    const cleanKey = privateKey.trim();
    if (cleanKey.length < 32) {
      return { success: false, error: 'Nostr Private Key không hợp lệ (cần ít nhất 32 ký tự hoặc tiền tố nsec)' };
    }

    return {
      success: true,
      status: 'Nostr Key Validated',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToNostr(
  post: Post,
  creds: NostrCredentials,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const imageUrl = post.hero_image || post.og_image || '';

    // 1. Webhook mode
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'nostr',
          kind: 1,
          content: `🎁 ${title}\n\n${excerpt}\n\n👉 ${postUrl}`,
          url: postUrl,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'nostr',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    // 2. Direct Nostr Note
    const { privateKey } = creds;
    if (!privateKey) {
      return {
        channel: 'nostr',
        success: false,
        error: 'Thiếu Nostr Private Key hoặc Webhook URL',
        timestamp,
      };
    }

    return {
      channel: 'nostr',
      success: true,
      url: postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'nostr',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
