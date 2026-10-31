import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface GenericCommunityCreds {
  webhookUrl?: string;
  accessToken?: string;
  apiKey?: string;
  channelId?: string;
  communityId?: string;
  broadcasterId?: string;
  clientId?: string;
}

async function handleGenericWebhookShare(
  channel: string,
  post: Post,
  webhookUrl?: string,
  extraPayload?: Record<string, any>
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  const cleanUrl = (webhookUrl || '').trim();
  if (!cleanUrl) {
    return {
      channel: channel as any,
      success: false,
      error: `Thiếu Webhook URL hoặc API Token cho kênh ${channel}`,
      timestamp,
    };
  }

  const postUrl = `${SITE_URL}${postPath(post)}`;
  const title = post.title || 'Guía de Regalos';
  const excerpt = post.seo_description || post.excerpt || '';
  const imageUrl = post.hero_image || post.og_image || '';

  try {
    const payload = {
      platform: channel,
      title,
      url: postUrl,
      excerpt,
      image_url: imageUrl,
      timestamp,
      ...extraPayload,
    };

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return {
        channel: channel as any,
        success: false,
        error: `Webhook ${channel} trả về HTTP ${res.status}: ${txt.slice(0, 100)}`,
        timestamp,
      };
    }

    return {
      channel: channel as any,
      success: true,
      url: postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: channel as any,
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}

async function testGenericWebhook(
  channel: string,
  webhookUrl?: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const cleanUrl = (webhookUrl || '').trim();
  if (!cleanUrl) {
    return { success: false, error: `Vui lòng nhập Webhook URL cho kênh ${channel}` };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ping',
        platform: channel,
        test: true,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook trả về HTTP ${res.status}` };
    }

    return { success: true, status: `${channel} Webhook Connected` };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// 1. TikTok
export async function testTikTokConnection(creds: GenericCommunityCreds) {
  return testGenericWebhook('TikTok', creds.webhookUrl);
}
export async function shareToTikTok(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('tiktok', post, creds.webhookUrl);
}

// 2. YouTube
export async function testYouTubeConnection(creds: GenericCommunityCreds) {
  if (creds.webhookUrl) return testGenericWebhook('YouTube', creds.webhookUrl);
  if (!creds.apiKey) return { success: false, error: 'Thiếu YouTube API Key hoặc Webhook URL' };
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${creds.channelId || 'UC_x5XG1OV2P6uZZ5FSM9Ttw'}&key=${creds.apiKey.trim()}`);
    return { success: res.ok, status: 'YouTube API Connected' };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
export async function shareToYouTube(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('youtube', post, creds.webhookUrl);
}

// 3. Dribbble
export async function testDribbbleConnection(creds: GenericCommunityCreds) {
  if (creds.webhookUrl) return testGenericWebhook('Dribbble', creds.webhookUrl);
  if (!creds.accessToken) return { success: false, error: 'Thiếu Dribbble Access Token hoặc Webhook URL' };
  try {
    const res = await fetch('https://api.dribbble.com/v2/user', {
      headers: { Authorization: `Bearer ${creds.accessToken.trim()}` },
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok, status: data?.name || 'Dribbble User' };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
export async function shareToDribbble(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('dribbble', post, creds.webhookUrl);
}

// 4. Whop
export async function testWhopConnection(creds: GenericCommunityCreds) {
  return testGenericWebhook('Whop', creds.webhookUrl);
}
export async function shareToWhop(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('whop', post, creds.webhookUrl);
}

// 5. Twitch
export async function testTwitchConnection(creds: GenericCommunityCreds) {
  return testGenericWebhook('Twitch', creds.webhookUrl);
}
export async function shareToTwitch(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('twitch', post, creds.webhookUrl);
}

// 6. Skool
export async function testSkoolConnection(creds: GenericCommunityCreds) {
  return testGenericWebhook('Skool', creds.webhookUrl);
}
export async function shareToSkool(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('skool', post, creds.webhookUrl);
}

// 7. Kick
export async function testKickConnection(creds: GenericCommunityCreds) {
  return testGenericWebhook('Kick', creds.webhookUrl);
}
export async function shareToKick(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('kick', post, creds.webhookUrl);
}

// 8. MeWe
export async function testMeWeConnection(creds: GenericCommunityCreds) {
  return testGenericWebhook('MeWe', creds.webhookUrl);
}
export async function shareToMeWe(post: Post, creds: GenericCommunityCreds) {
  return handleGenericWebhookShare('mewe', post, creds.webhookUrl);
}
