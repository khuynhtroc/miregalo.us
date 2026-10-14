import crypto from 'crypto';
import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

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

/**
 * Tests Twitter API v2 credentials by querying user info
 */
export async function testTwitterConnection(credentials: {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}): Promise<{ success: boolean; username?: string; error?: string }> {
  try {
    const { apiKey, apiSecret, accessToken, accessSecret } = credentials;
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return { success: false, error: 'Vui lòng điền đủ 4 trường: API Key, API Secret, Access Token, Access Secret' };
    }

    const url = `${TWITTER_API_BASE}/users/me`;
    const authHeader = buildOAuthHeader('GET', url, credentials);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok || data.errors) {
      const errDetail = data.errors?.[0]?.message || data.detail || 'Xác thực Twitter thất bại';
      return { success: false, error: errDetail };
    }

    return {
      success: true,
      username: `@${data.data?.username || 'user'}`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a tweet to X (Twitter)
 */
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
    const { apiKey, apiSecret, accessToken, accessSecret } = credentials;
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return {
        channel: 'twitter',
        success: false,
        error: 'Chưa cấu hình đầy đủ API Key / Access Token cho X (Twitter)',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';

    let text = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n👉 Descubre las mejores ideas aquí: ${postUrl}\n\n#regalos #ideaspararegalar #miregalo`;

    // Limit tweet length to 280 characters
    if (text.length > 280) {
      const excess = text.length - 277;
      text = text.slice(0, text.length - excess) + '...';
    }

    const url = `${TWITTER_API_BASE}/tweets`;
    const authHeader = buildOAuthHeader('POST', url, credentials);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (!res.ok || data.errors) {
      const errMsg = data.errors?.[0]?.message || data.detail || 'Lỗi khi đăng tweet lên X';
      return {
        channel: 'twitter',
        success: false,
        error: errMsg,
        timestamp,
      };
    }

    const tweetId = data.data?.id;
    return {
      channel: 'twitter',
      success: true,
      post_id: tweetId,
      url: `https://x.com/i/status/${tweetId}`,
      message: 'Đăng Tweet lên X thành công',
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
