import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

export interface ListmonkCredentials {
  url?: string;
  username?: string;
  password?: string;
  listId?: string;
  webhookUrl?: string;
}

export async function testListmonkConnection(
  creds: ListmonkCredentials
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, status: 'Webhook endpoint' };
    }

    const { url, username, password } = creds;
    if (!url || !username || !password) {
      return { success: false, error: 'Vui lòng cung cấp Listmonk URL, Username và Password (hoặc Webhook URL)' };
    }

    const cleanUrl = url.trim().replace(/\/+$/, '');
    const auth = Buffer.from(`${username.trim()}:${password.trim()}`).toString('base64');
    const res = await fetch(`${cleanUrl}/api/health`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      return { success: false, error: `Listmonk HTTP ${res.status}` };
    }

    return {
      success: true,
      status: 'Listmonk Instance Connected',
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToListmonk(
  post: Post,
  creds: ListmonkCredentials,
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
          platform: 'listmonk',
          title,
          url: postUrl,
          excerpt,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'listmonk',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    // 2. Direct Listmonk Campaign
    const { url, username, password, listId } = creds;
    if (!url || !username || !password) {
      return {
        channel: 'listmonk',
        success: false,
        error: 'Thiếu Listmonk URL, Username hoặc Password',
        timestamp,
      };
    }

    const cleanUrl = url.trim().replace(/\/+$/, '');
    const auth = Buffer.from(`${username.trim()}:${password.trim()}`).toString('base64');
    const targetListId = parseInt((listId || '1').trim(), 10) || 1;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a202c; font-size: 24px;">${title}</h1>
        ${imageUrl ? `<p><img src="${imageUrl}" alt="${title}" style="max-width: 100%; border-radius: 8px;" /></p>` : ''}
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">${excerpt}</p>
        <p style="margin-top: 24px;">
          <a href="${postUrl}" style="display: inline-block; background: #e53e3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Descubre todos los regalos aquí &rarr;
          </a>
        </p>
      </div>
    `;

    const res = await fetch(`${cleanUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Post: ${title}`.slice(0, 100),
        subject: `🎁 ${title}`.slice(0, 120),
        lists: [targetListId],
        type: 'regular',
        content_type: 'html',
        body: emailBody,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        channel: 'listmonk',
        success: false,
        error: data?.message || `Listmonk API HTTP ${res.status}`,
        timestamp,
      };
    }

    return {
      channel: 'listmonk',
      success: true,
      post_id: String(data?.data?.id || ''),
      url: postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'listmonk',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
