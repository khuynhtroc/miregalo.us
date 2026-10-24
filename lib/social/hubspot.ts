import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const HUBSPOT_API = 'https://api.hubapi.com';

/**
 * Resolves HubSpot Blog Content Group ID if not explicitly configured.
 */
export async function resolveHubSpotBlogInfo(
  accessToken: string,
  blogGroupId?: string
): Promise<{ blogId: string | null; blogName?: string; error?: string }> {
  const cleanToken = (accessToken || '').trim();
  if (!cleanToken) {
    return { blogId: null, error: 'Vui lòng nhập HubSpot Private App Access Token (pat-...).' };
  }

  if (blogGroupId && blogGroupId.trim()) {
    return { blogId: blogGroupId.trim(), blogName: `Blog #${blogGroupId.trim()}` };
  }

  try {
    // Query HubSpot v2 blogs endpoint to auto-detect the primary blog ID
    const res = await fetch(`${HUBSPOT_API}/content/api/v2/blogs?limit=5`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.objects) && data.objects.length > 0) {
      const first = data.objects[0];
      return {
        blogId: String(first.id),
        blogName: first.name || first.html_title || String(first.id),
      };
    }

    return {
      blogId: null,
      error:
        data?.message ||
        'Không tìm thấy Blog trong tài khoản HubSpot. Hãy đảm bảo Private App có quyền "content" (CMS Blog) và đã tạo ít nhất 1 Blog trong HubSpot.',
    };
  } catch (err: any) {
    return { blogId: null, error: err?.message || String(err) };
  }
}

export async function testHubSpotConnection(
  accessToken: string,
  blogGroupId?: string
): Promise<{ success: boolean; blog_id?: string; blog_name?: string; error?: string }> {
  const info = await resolveHubSpotBlogInfo(accessToken, blogGroupId);
  if (!info.blogId) {
    return { success: false, error: info.error || 'Kết nối HubSpot thất bại' };
  }
  return {
    success: true,
    blog_id: info.blogId,
    blog_name: info.blogName,
  };
}

/**
 * Publishes an SEO syndication post with dofollow backlink and featured image to HubSpot CMS Blog.
 */
export async function shareToHubSpot(
  post: Post,
  accessToken: string,
  blogGroupId?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const info = await resolveHubSpotBlogInfo(accessToken, blogGroupId);
    if (!info.blogId) {
      return {
        channel: 'hubspot',
        success: false,
        error: info.error || 'Thiếu HubSpot Blog Content Group ID',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const rawImg = post.og_image || post.hero_image || post.items?.find((it) => it?.image)?.image || '';
    const imageUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`) : '';

    const postSummaryHtml = `
      <p>${excerpt}</p>
      ${imageUrl ? `<p><img src="${imageUrl}" alt="${title.replace(/"/g, '&quot;')}" style="max-width:100%;border-radius:12px;" /></p>` : ''}
      ${post.intro_html || ''}
      <hr />
      <p><strong>👉 Descubre la guía completa con todas las ideas y recomendaciones en nuestro portal oficial: <a href="${postUrl}">${title}</a></strong></p>
    `.trim();

    const payload: Record<string, any> = {
      name: title,
      htmlTitle: title,
      contentGroupId: info.blogId,
      metaDescription: excerpt.slice(0, 160),
      postBody: postSummaryHtml,
      postSummary: `<p>${excerpt}</p>`,
      slug: `${post.slug}-${Date.now().toString(36).slice(-4)}`,
      state: 'PUBLISHED',
    };

    if (imageUrl) {
      payload.featuredImage = imageUrl;
      payload.featuredImageAltText = title;
      payload.useFeaturedImage = true;
    }

    const res = await fetch(`${HUBSPOT_API}/cms/v3/blogs/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      return {
        channel: 'hubspot',
        success: false,
        error: `HubSpot API (${res.status}): ${data?.message || JSON.stringify(data)}`,
        timestamp,
      };
    }

    return {
      channel: 'hubspot',
      success: true,
      post_id: String(data.id),
      url: data.url || '',
      message: 'Đã đăng bài SEO kèm Backlink lên HubSpot Blog thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'hubspot',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
