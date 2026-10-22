import 'server-only';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { SocialSettings, ChannelShareResult } from './types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const X_API_BASE = 'https://api.x.com/2';

let refreshInFlight: Promise<string> | null = null;

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function buildOAuthHeader(
  method: string,
  url: string,
  credentials: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  }
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey.trim(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken.trim(),
    oauth_version: '1.0',
  };

  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(credentials.apiSecret.trim())}&${percentEncode(credentials.accessSecret.trim())}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`);

  return `OAuth ${headerParts.join(', ')}`;
}

async function getStoredTwitterSettings(): Promise<Partial<SocialSettings>> {
  return (await db.getSetting<Partial<SocialSettings>>('social_settings')) || {};
}

async function refreshTwitterOAuth2Token(settings: Partial<SocialSettings>): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const clientId = settings.twitter_oauth2_client_id?.trim();
    const clientSecret = settings.twitter_oauth2_client_secret;
    const refreshToken = settings.twitter_oauth2_refresh_token;
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Thiếu cấu hình OAuth 2.0 hoặc refresh token của X. Hãy kết nối lại tài khoản X.');
    }

    const form = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const response = await fetch(`${X_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      throw new Error(`Không thể làm mới quyền truy cập X (HTTP ${response.status}). Hãy kết nối lại tài khoản X.`);
    }

    const latest = await getStoredTwitterSettings();
    await db.setSetting('social_settings', {
      ...latest,
      twitter_oauth2_access_token: data.access_token,
      twitter_oauth2_refresh_token: data.refresh_token || refreshToken,
      twitter_oauth2_expires_at: Date.now() + Number(data.expires_in || 7200) * 1000,
    });
    return data.access_token as string;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/** Returns a current user access token, refreshing and persisting it when it is near expiry. */
export async function getTwitterOAuth2AccessToken(): Promise<string | null> {
  const settings = await getStoredTwitterSettings();
  const accessToken = settings.twitter_oauth2_access_token;
  const refreshToken = settings.twitter_oauth2_refresh_token;
  if (!accessToken && !refreshToken) return null;

  const expiresAt = Number(settings.twitter_oauth2_expires_at || 0);
  if (accessToken && (!expiresAt || expiresAt > Date.now() + 60_000)) return accessToken;
  return refreshTwitterOAuth2Token(settings);
}

function getApiError(data: any, fallback: string): string {
  const message = data?.errors?.[0]?.message || data?.detail || data?.title || data?.error_description || fallback;
  const errorType = String(data?.type || data?.errors?.[0]?.type || '');
  if (
    /credits[-_ ]depleted/i.test(errorType) ||
    /credits[-_ ]depleted/i.test(String(message))
  ) {
    return 'X API đã hết credits nên chưa thể đăng bài. Mở X Developer Console → Credits/Billing, kiểm tra và nạp credits cho đúng Project đang gắn với App này, rồi thử lại. Đây không phải lỗi quyền OAuth hay token.';
  }
  if (/oauth1 app permissions|app cannot perform write actions/i.test(String(message))) {
    return 'X từ chối quyền đăng bài của OAuth 1.0a. Trong X Developer Console, cấp quyền Read and write rồi tạo lại Access Token và Access Token Secret. Hoặc triển khai luồng OAuth 2.0 của website và bấm “Kết nối tài khoản X”.';
  }
  return message;
}

function oauth2NeedsConnection(settings: Partial<SocialSettings>): boolean {
  return Boolean(settings.twitter_oauth2_client_id && !settings.twitter_oauth2_access_token && !settings.twitter_oauth2_refresh_token);
}

async function getTwitterUsername(accessToken: string): Promise<{ success: boolean; username?: string; error?: string }> {
  const response = await fetch(`${X_API_BASE}/users/me?user.fields=username`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.errors || !data.data?.username) {
    return { success: false, error: getApiError(data, 'Không thể đọc thông tin tài khoản X') };
  }
  return { success: true, username: `@${data.data.username}` };
}

/** Tests OAuth 2.0 first, then falls back to previously configured OAuth 1.0a credentials. */
export async function testTwitterConnection(credentials?: {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessSecret?: string;
}): Promise<{ success: boolean; username?: string; error?: string }> {
  try {
    let oauth2Token: string | null;
    try {
      oauth2Token = await getTwitterOAuth2AccessToken();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Không thể làm mới quyền truy cập X' };
    }
    if (oauth2Token) return await getTwitterUsername(oauth2Token);

    const storedSettings = await getStoredTwitterSettings();
    if (oauth2NeedsConnection(storedSettings)) {
      return { success: false, error: 'OAuth 2.0 đã được cấu hình nhưng tài khoản X chưa được kết nối. Hãy triển khai phiên bản mới của website rồi bấm “Kết nối tài khoản X”.' };
    }

    const { apiKey = '', apiSecret = '', accessToken = '', accessSecret = '' } = credentials || {};
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return { success: false, error: 'Hãy kết nối X bằng OAuth 2.0 hoặc điền đủ 4 trường OAuth 1.0a' };
    }

    const url = `${TWITTER_API_BASE}/users/me`;
    const authHeader = buildOAuthHeader('GET', url, { apiKey, apiSecret, accessToken, accessSecret });
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.errors || !data.data?.username) {
      return { success: false, error: getApiError(data, 'Xác thực X thất bại') };
    }
    return { success: true, username: `@${data.data.username}` };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/** Publishes a post using OAuth 2.0 when connected, or the existing OAuth 1.0a credentials. */
export async function shareToTwitter(
  post: Post,
  credentials: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  },
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    let oauth2Token: string | null;
    try {
      oauth2Token = await getTwitterOAuth2AccessToken();
    } catch (err: any) {
      return {
        channel: 'twitter',
        success: false,
        error: err?.message || 'Không thể làm mới quyền truy cập X',
        timestamp,
      };
    }

    const storedSettings = oauth2Token ? null : await getStoredTwitterSettings();
    if (storedSettings && oauth2NeedsConnection(storedSettings)) {
      return {
        channel: 'twitter',
        success: false,
        error: 'OAuth 2.0 đã được cấu hình nhưng tài khoản X chưa được kết nối. Hãy triển khai phiên bản mới của website rồi bấm “Kết nối tài khoản X”.',
        timestamp,
      };
    }

    if (!oauth2Token && (!credentials.apiKey || !credentials.apiSecret || !credentials.accessToken || !credentials.accessSecret)) {
      return {
        channel: 'twitter',
        success: false,
        error: 'Hãy kết nối X bằng OAuth 2.0 hoặc cấu hình đủ thông tin OAuth 1.0a',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    let text = template
      ? template.replace(/{title}/g, title).replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n👉 Descubre las mejores ideas aquí: ${postUrl}\n\n#regalos #ideaspararegalar #miregalo`;

    if (text.length > 280) {
      const excess = text.length - 277;
      text = text.slice(0, text.length - excess) + '...';
    }

    const url = `${oauth2Token ? X_API_BASE : TWITTER_API_BASE}/tweets`;
    const authHeader = oauth2Token ? `Bearer ${oauth2Token}` : buildOAuthHeader('POST', url, credentials);
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.errors || !data.data?.id) {
      return {
        channel: 'twitter',
        success: false,
        error: getApiError(data, 'Lỗi khi đăng bài lên X'),
        timestamp,
      };
    }

    const tweetId = data.data.id;
    return {
      channel: 'twitter',
      success: true,
      post_id: tweetId,
      url: `https://x.com/i/status/${tweetId}`,
      message: 'Đăng bài lên X thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'twitter',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
