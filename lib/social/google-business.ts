import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface GoogleBusinessCredentials {
  accountId?: string;
  locationId?: string;
  accessToken?: string;
  webhookUrl?: string;
}

export async function testGoogleBusinessConnection(
  creds: GoogleBusinessCredentials
): Promise<{ success: boolean; location_name?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, location_name: 'Webhook endpoint' };
    }

    const { accountId, locationId, accessToken } = creds;
    if (!accessToken) {
      return { success: false, error: 'Vui lòng cung cấp Google My Business OAuth Access Token hoặc Webhook URL' };
    }

    const cleanToken = accessToken.trim();
    const cleanAccount = (accountId || '').trim();
    const cleanLocation = (locationId || '').trim();

    if (cleanAccount && cleanLocation) {
      const res = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${cleanAccount}/locations/${cleanLocation}?readMask=title,name`,
        {
          headers: { Authorization: `Bearer ${cleanToken}` },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, location_name: data.title || cleanLocation };
      }
    }

    // Fallback: check profile / accounts
    const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error?.message || `Google API HTTP ${res.status}` };
    }

    return {
      success: true,
      location_name: data?.accounts?.[0]?.accountName || 'Google Business Account',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToGoogleBusiness(
  post: Post,
  creds: GoogleBusinessCredentials,
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
          platform: 'google_business',
          title,
          url: postUrl,
          excerpt,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'google_business',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    // 2. Direct GMB API
    const { accountId, locationId, accessToken } = creds;
    if (!accessToken || !accountId || !locationId) {
      return {
        channel: 'google_business',
        success: false,
        error: 'Thiếu Account ID, Location ID hoặc Access Token Google Business',
        timestamp,
      };
    }

    const payload = {
      languageCode: 'es-US',
      summary: `${title}\n\n${excerpt}`.slice(0, 1500),
      callToAction: {
        actionType: 'LEARN_MORE',
        url: postUrl,
      },
      media: imageUrl
        ? [
            {
              mediaFormat: 'PHOTO',
              sourceUrl: imageUrl,
            },
          ]
        : [],
      topicType: 'STANDARD',
    };

    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId.trim()}/locations/${locationId.trim()}/localPosts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        channel: 'google_business',
        success: false,
        error: data?.error?.message || `Google Business API lỗi (${res.status})`,
        timestamp,
      };
    }

    return {
      channel: 'google_business',
      success: true,
      post_id: data?.name || data?.id,
      url: data?.searchUrl || postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'google_business',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
