import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

function normalizeWpSiteUrl(url: string): string {
  const clean = (url || '').trim().replace(/\/+$/, '');
  if (!clean) return '';
  return clean.startsWith('http') ? clean : `https://${clean}`;
}

function buildBasicAuth(username: string, appPassword: string): string {
  const cleanPass = appPassword.trim();
  const raw = `${username.trim()}:${cleanPass}`;
  return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
}

/**
 * Supports both:
 * 1) WordPress.com sites (via public-api.wordpress.com or wp-json/wp/v2 with Application Password)
 * 2) Self-hosted WordPress sites (/wp-json/wp/v2/users/me)
 */
export async function testWordPressConnection(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{ success: boolean; site?: string; user?: string; error?: string }> {
  try {
    const base = normalizeWpSiteUrl(siteUrl);
    if (!base || !username?.trim() || !appPassword?.trim()) {
      return {
        success: false,
        error: 'Vui lòng nhập đầy đủ WordPress Site URL, Username và Application Password',
      };
    }

    const res = await fetch(`${base}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: buildBasicAuth(username, appPassword),
        Accept: 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      return {
        success: false,
        error:
          data?.message ||
          `WordPress REST API (${res.status}): Kiểm tra lại Site URL hoặc tạo Application Password trong Users > Profile`,
      };
    }

    return {
      success: true,
      site: base,
      user: data.name || data.slug || username,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes an SEO summary article with dofollow backlink and cover image to WordPress.
 */
export async function shareToWordPress(
  post: Post,
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const base = normalizeWpSiteUrl(siteUrl);
    if (!base || !username?.trim() || !appPassword?.trim()) {
      return {
        channel: 'wordpress',
        success: false,
        error: 'Thiếu cấu hình WordPress (Site URL, Username hoặc Application Password)',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const rawImg = post.og_image || post.hero_image || post.items?.find((it) => it?.image)?.image || '';
    const imageUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`) : '';

    const htmlContent = `
      ${imageUrl ? `<figure><img src="${imageUrl}" alt="${title.replace(/"/g, '&quot;')}" style="max-width:100%;height:auto;border-radius:12px;" /></figure>` : ''}
      <p>${excerpt}</p>
      ${post.intro_html || ''}
      <hr />
      <p><strong>🎁 Lee el artículo completo y descubre todas las ideas en: <a href="${postUrl}">${title}</a></strong></p>
    `.trim();

    const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: buildBasicAuth(username, appPassword),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content: htmlContent,
        excerpt,
        status: 'publish',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      return {
        channel: 'wordpress',
        success: false,
        error: `WordPress API (${res.status}): ${data?.message || JSON.stringify(data)}`,
        timestamp,
      };
    }

    return {
      channel: 'wordpress',
      success: true,
      post_id: String(data.id),
      url: data.link || `${base}/?p=${data.id}`,
      message: 'Đã đăng bài kèm Backlink SEO lên WordPress thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'wordpress',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
