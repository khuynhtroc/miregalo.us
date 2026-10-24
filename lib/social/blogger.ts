import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const BLOGGER_API = 'https://www.googleapis.com/blogger/v3';

export async function testBloggerConnection(
  blogId: string,
  accessToken: string
): Promise<{ success: boolean; blog_name?: string; blog_url?: string; error?: string }> {
  try {
    const cleanBlogId = (blogId || '').trim();
    const cleanToken = (accessToken || '').trim();
    if (!cleanBlogId || !cleanToken) {
      return {
        success: false,
        error: 'Vui lòng nhập Blogger Blog ID và Google OAuth2 Access Token',
      };
    }

    const res = await fetch(`${BLOGGER_API}/blogs/${encodeURIComponent(cleanBlogId)}`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      return {
        success: false,
        error: data?.error?.message || `Blogger API (${res.status}): Kiểm tra lại Blog ID hoặc OAuth2 Token`,
      };
    }

    return {
      success: true,
      blog_name: data.name,
      blog_url: data.url,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes an HTML post with cover image and contextual dofollow backlink to Google Blogger (Blogspot).
 */
export async function shareToBlogger(
  post: Post,
  blogId: string,
  accessToken: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanBlogId = (blogId || '').trim();
    const cleanToken = (accessToken || '').trim();
    if (!cleanBlogId || !cleanToken) {
      return {
        channel: 'blogger',
        success: false,
        error: 'Thiếu Blogger Blog ID hoặc OAuth2 Access Token',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const rawImg = post.og_image || post.hero_image || post.items?.find((it) => it?.image)?.image || '';
    const imageUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`) : '';

    const htmlContent = `
      ${imageUrl ? `<p><img src="${imageUrl}" alt="${title.replace(/"/g, '&quot;')}" style="max-width:100%;height:auto;border-radius:12px;" /></p>` : ''}
      <p>${excerpt}</p>
      ${post.intro_html || ''}
      <hr />
      <p><strong>🎁 Explora la guía completa con todas las ideas en: <a href="${postUrl}">${title}</a></strong></p>
    `.trim();

    const res = await fetch(`${BLOGGER_API}/blogs/${encodeURIComponent(cleanBlogId)}/posts/?isDraft=false`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'blogger#post',
        blog: { id: cleanBlogId },
        title,
        content: htmlContent,
        labels: ['Regalos', 'Ideas de Regalos', 'Miregalo'],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      return {
        channel: 'blogger',
        success: false,
        error: `Blogger API (${res.status}): ${data?.error?.message || JSON.stringify(data)}`,
        timestamp,
      };
    }

    return {
      channel: 'blogger',
      success: true,
      post_id: String(data.id),
      url: data.url || '',
      message: 'Đã đăng bài kèm Backlink lên Google Blogger (Blogspot) thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'blogger',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
