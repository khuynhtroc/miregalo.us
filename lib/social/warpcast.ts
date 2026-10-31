import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface WarpcastCredentials {
  apiKey?: string;
  signerUuid?: string;
  webhookUrl?: string;
}

export async function testWarpcastConnection(
  creds: WarpcastCredentials
): Promise<{ success: boolean; user?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, user: 'Webhook endpoint' };
    }

    const { apiKey, signerUuid } = creds;
    if (!apiKey) {
      return { success: false, error: 'Vui lòng cung cấp Neynar API Key hoặc Webhook URL' };
    }

    const res = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid?.trim() || ''}`, {
      headers: {
        api_key: apiKey.trim(),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.message || `Warpcast/Neynar API HTTP ${res.status}` };
    }

    return {
      success: true,
      user: data?.status || 'Signer Active',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToWarpcast(
  post: Post,
  creds: WarpcastCredentials,
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
          platform: 'warpcast',
          title,
          url: postUrl,
          excerpt,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'warpcast',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    const { apiKey, signerUuid } = creds;
    if (!apiKey || !signerUuid) {
      return {
        channel: 'warpcast',
        success: false,
        error: 'Thiếu Neynar API Key hoặc Signer UUID cho Warpcast',
        timestamp,
      };
    }

    const castText = `🎁 ${title}\n\n${excerpt}\n\n👉 ${postUrl}`.slice(0, 320);

    const res = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_key: apiKey.trim(),
      },
      body: JSON.stringify({
        signer_uuid: signerUuid.trim(),
        text: castText,
        embeds: [{ url: postUrl }],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        channel: 'warpcast',
        success: false,
        error: data?.message || `Lỗi đăng Warpcast (HTTP ${res.status})`,
        timestamp,
      };
    }

    return {
      channel: 'warpcast',
      success: true,
      post_id: data?.cast?.hash,
      url: data?.cast?.hash ? `https://warpcast.com/~/conversations/${data.cast.hash}` : postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'warpcast',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
