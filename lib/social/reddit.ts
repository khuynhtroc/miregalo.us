import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface RedditCredentials {
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  subreddit?: string;
  webhookUrl?: string;
}

export async function testRedditConnection(
  creds: RedditCredentials
): Promise<{ success: boolean; username?: string; subreddit?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, subreddit: 'Webhook endpoint' };
    }

    const { clientId, clientSecret, username, password, subreddit } = creds;
    if (!clientId || !clientSecret || !username || !password) {
      return {
        success: false,
        error: 'Vui lòng điền Client ID, Client Secret, Username và Password của Reddit (hoặc dán Webhook URL)',
      };
    }

    const basicAuth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `web:miregalo:v1.0 (by /u/${username.trim()})`,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: username.trim(),
        password: password.trim(),
      }).toString(),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData?.access_token) {
      return {
        success: false,
        error: tokenData?.error || 'Xác thực Reddit thất bại. Kiểm tra lại Client ID, Secret, Username hoặc Password',
      };
    }

    return {
      success: true,
      username: username.trim(),
      subreddit: subreddit ? `r/${subreddit.replace(/^r\//, '')}` : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToReddit(
  post: Post,
  creds: RedditCredentials,
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
      const payload = {
        platform: 'reddit',
        subreddit: creds.subreddit || '',
        title,
        url: postUrl,
        excerpt,
        image_url: imageUrl,
        timestamp,
      };
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return {
        channel: 'reddit',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    // 2. Direct Reddit API
    const { clientId, clientSecret, username, password, subreddit } = creds;
    if (!clientId || !clientSecret || !username || !password || !subreddit) {
      return {
        channel: 'reddit',
        success: false,
        error: 'Thiếu thông tin xác thực Reddit hoặc chưa chọn Subreddit',
        timestamp,
      };
    }

    const cleanSubreddit = subreddit.trim().replace(/^r\//, '');
    const basicAuth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `web:miregalo:v1.0 (by /u/${username.trim()})`,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: username.trim(),
        password: password.trim(),
      }).toString(),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData?.access_token) {
      return {
        channel: 'reddit',
        success: false,
        error: `Lỗi đăng nhập Reddit: ${tokenData?.error || tokenRes.statusText}`,
        timestamp,
      };
    }

    const submitRes = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `web:miregalo:v1.0 (by /u/${username.trim()})`,
      },
      body: new URLSearchParams({
        sr: cleanSubreddit,
        kind: 'link',
        title,
        url: postUrl,
        resubmit: 'true',
      }).toString(),
    });

    const submitData = await submitRes.json().catch(() => ({}));
    const postRedditUrl = submitData?.json?.data?.url;

    if (!submitRes.ok || submitData?.json?.errors?.length > 0) {
      const errDetail = submitData?.json?.errors?.map((e: any) => e[1]).join(', ') || `HTTP ${submitRes.status}`;
      return {
        channel: 'reddit',
        success: false,
        error: `Lỗi đăng Reddit: ${errDetail}`,
        timestamp,
      };
    }

    return {
      channel: 'reddit',
      success: true,
      post_id: submitData?.json?.data?.id,
      url: postRedditUrl || postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'reddit',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
