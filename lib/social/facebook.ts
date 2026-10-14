import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0';

/**
 * Verifies Facebook Page Access Token and retrieves Page Name
 */
export async function testFacebookConnection(
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; page_name?: string; error?: string }> {
  try {
    const cleanId = pageId.trim();
    const cleanToken = accessToken.trim();
    if (!cleanId || !cleanToken) {
      return { success: false, error: 'Page ID hoặc Access Token chưa được điền' };
    }

    const res = await fetch(`${FB_GRAPH_API}/${cleanId}?fields=id,name,link&access_token=${encodeURIComponent(cleanToken)}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || 'Không thể xác thực Facebook Page' };
    }

    return {
      success: true,
      page_name: data.name || cleanId,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a link post to Facebook Fanpage
 */
export async function shareToFacebook(
  post: Post,
  pageId: string,
  accessToken: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanId = pageId.trim();
    const cleanToken = accessToken.trim();
    if (!cleanId || !cleanToken) {
      return {
        channel: 'facebook',
        success: false,
        error: 'Facebook Page ID hoặc Token bị thiếu',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';

    let message = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n${excerpt}\n\n👉 Descubre todas las ideas y detalles aquí: ${postUrl}`;

    const params = new URLSearchParams({
      message,
      link: postUrl,
      access_token: cleanToken,
    });

    const res = await fetch(`${FB_GRAPH_API}/${cleanId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        channel: 'facebook',
        success: false,
        error: data.error?.message || 'Lỗi khi đăng bài lên Facebook Fanpage',
        timestamp,
      };
    }

    const postId = data.id;
    return {
      channel: 'facebook',
      success: true,
      post_id: postId,
      url: `https://facebook.com/${postId}`,
      message: 'Đăng bài lên Facebook Fanpage thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'facebook',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
