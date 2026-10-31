import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface LemmyCredentials {
  instanceUrl?: string;
  jwtToken?: string;
  communityId?: string;
  webhookUrl?: string;
}

export async function testLemmyConnection(
  creds: LemmyCredentials
): Promise<{ success: boolean; site_name?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, site_name: 'Webhook endpoint' };
    }

    const { instanceUrl, jwtToken } = creds;
    if (!instanceUrl) {
      return { success: false, error: 'Vui lòng cung cấp Instance URL của Lemmy (vd: https://lemmy.world)' };
    }

    const cleanInstance = instanceUrl.trim().replace(/\/+$/, '');
    const res = await fetch(`${cleanInstance}/api/v3/site`, {
      headers: jwtToken ? { Authorization: `Bearer ${jwtToken.trim()}` } : {},
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, error: data?.error || `Lemmy HTTP ${res.status}` };
    }

    return {
      success: true,
      site_name: data?.site_view?.site?.name || cleanInstance,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToLemmy(
  post: Post,
  creds: LemmyCredentials,
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
          platform: 'lemmy',
          title,
          url: postUrl,
          excerpt,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'lemmy',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    const { instanceUrl, jwtToken, communityId } = creds;
    if (!instanceUrl || !jwtToken || !communityId) {
      return {
        channel: 'lemmy',
        success: false,
        error: 'Thiếu Lemmy Instance URL, JWT Token hoặc Community ID',
        timestamp,
      };
    }

    const cleanInstance = instanceUrl.trim().replace(/\/+$/, '');
    const parsedCommId = parseInt(communityId.trim(), 10);

    const res = await fetch(`${cleanInstance}/api/v3/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken.trim()}`,
      },
      body: JSON.stringify({
        name: title,
        url: postUrl,
        body: `${excerpt}\n\n👉 [${postUrl}](${postUrl})`,
        community_id: isNaN(parsedCommId) ? 1 : parsedCommId,
        auth: jwtToken.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      return {
        channel: 'lemmy',
        success: false,
        error: data?.error || `Lemmy HTTP ${res.status}`,
        timestamp,
      };
    }

    const postLemmyUrl = data?.post_view?.post?.ap_id;
    return {
      channel: 'lemmy',
      success: true,
      post_id: String(data?.post_view?.post?.id || ''),
      url: postLemmyUrl || postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'lemmy',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
