import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const MEDIUM_API_BASE = 'https://api.medium.com/v1';

/**
 * Tests Medium integration token by fetching user profile
 */
export async function testMediumConnection(token: string): Promise<{
  success: boolean;
  username?: string;
  user_id?: string;
  error?: string;
}> {
  try {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { success: false, error: 'Chưa điền Medium Integration Token' };
    }

    const res = await fetch(`${MEDIUM_API_BASE}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok || data.errors) {
      const err = data.errors?.[0]?.message || 'Xác thực token Medium thất bại';
      return { success: false, error: err };
    }

    return {
      success: true,
      username: data.data?.username,
      user_id: data.data?.id,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes an article to Medium with canonical URL referencing the original post
 */
export async function shareToMedium(
  post: Post,
  token: string,
  options?: {
    publicationId?: string;
    publishStatus?: 'public' | 'draft' | 'unlisted';
  }
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return {
        channel: 'medium',
        success: false,
        error: 'Chưa cấu hình Medium Integration Token',
        timestamp,
      };
    }

    // 1. Get Medium user ID
    const userRes = await testMediumConnection(cleanToken);
    if (!userRes.success || !userRes.user_id) {
      return {
        channel: 'medium',
        success: false,
        error: userRes.error || 'Không tìm thấy tài khoản Medium tương ứng với token',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const canonicalNote = `<p><em>Artículo publicado originalmente en <a href="${postUrl}">Miregalo - Guías de Regalos</a>.</em></p>`;
    const fullContent = `<h1>${title}</h1>${canonicalNote}${post.content_html || `<p>${post.excerpt}</p>`}`;

    const endpoint = options?.publicationId
      ? `${MEDIUM_API_BASE}/publications/${options.publicationId}/posts`
      : `${MEDIUM_API_BASE}/users/${userRes.user_id}/posts`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        contentFormat: 'html',
        content: fullContent,
        canonicalUrl: postUrl,
        tags: ['regalos', 'gifts', 'compras', 'ideas', 'guia'],
        publishStatus: options?.publishStatus || 'public',
      }),
    });

    const data = await res.json();
    if (!res.ok || data.errors) {
      const errMsg = data.errors?.[0]?.message || 'Lỗi khi xuất bản bài viết lên Medium';
      return {
        channel: 'medium',
        success: false,
        error: errMsg,
        timestamp,
      };
    }

    const mediumUrl = data.data?.url;
    return {
      channel: 'medium',
      success: true,
      post_id: data.data?.id,
      url: mediumUrl,
      message: 'Đã xuất bản bài viết lên Medium thành công (Canonical SEO)',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'medium',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
