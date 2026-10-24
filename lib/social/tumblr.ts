import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const TUMBLR_API = 'https://api.tumblr.com/v2';

function normalizeBlogIdentifier(blogName: string): string {
  const clean = (blogName || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  if (!clean) return '';
  return clean.includes('.') ? clean : `${clean}.tumblr.com`;
}

export async function testTumblrConnection(
  blogName: string,
  accessToken: string
): Promise<{ success: boolean; blog_title?: string; blog_url?: string; error?: string }> {
  try {
    const blogId = normalizeBlogIdentifier(blogName);
    const cleanToken = (accessToken || '').trim();
    if (!blogId || !cleanToken) {
      return {
        success: false,
        error: 'Vui lòng nhập Tên Blog Tumblr (VD: miregalo.tumblr.com) và OAuth2 Access Token',
      };
    }

    const res = await fetch(`${TUMBLR_API}/blog/${encodeURIComponent(blogId)}/info`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    const blog = data?.response?.blog;
    if (!res.ok || !blog) {
      return {
        success: false,
        error: data?.meta?.msg || `Tumblr API (${res.status}): Không truy cập được Blog ${blogId}`,
      };
    }

    return {
      success: true,
      blog_title: blog.title || blog.name,
      blog_url: blog.url,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes an NPF post (image + description + link block) to Tumblr for Web 2.0 SEO backlinks.
 */
export async function shareToTumblr(
  post: Post,
  blogName: string,
  accessToken: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const blogId = normalizeBlogIdentifier(blogName);
    const cleanToken = (accessToken || '').trim();
    if (!blogId || !cleanToken) {
      return {
        channel: 'tumblr',
        success: false,
        error: 'Thiếu Tumblr Blog Name hoặc Access Token',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const rawImg = post.og_image || post.hero_image || post.items?.find((it) => it?.image)?.image || '';
    const imageUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`) : '';

    const contentBlocks: any[] = [
      {
        type: 'text',
        subtype: 'heading1',
        text: title,
      },
    ];

    if (imageUrl) {
      contentBlocks.push({
        type: 'image',
        media: [{ url: imageUrl }],
        alt_text: title,
      });
    }

    if (excerpt) {
      contentBlocks.push({
        type: 'text',
        text: excerpt,
      });
    }

    contentBlocks.push({
      type: 'link',
      url: postUrl,
      title,
      description: excerpt.slice(0, 200),
      ...(imageUrl ? { poster: [{ url: imageUrl }] } : {}),
    });

    const res = await fetch(`${TUMBLR_API}/blog/${encodeURIComponent(blogId)}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: contentBlocks,
        tags: ['regalos', 'ideas de regalos', 'miregalo', 'regalos originales'],
        state: 'published',
      }),
    });

    const data = await res.json().catch(() => ({}));
    const postId = data?.response?.id_string || data?.response?.id;
    if (!res.ok || !postId) {
      return {
        channel: 'tumblr',
        success: false,
        error: `Tumblr API (${res.status}): ${data?.meta?.msg || JSON.stringify(data)}`,
        timestamp,
      };
    }

    return {
      channel: 'tumblr',
      success: true,
      post_id: String(postId),
      url: `https://${blogId}/post/${postId}`,
      message: 'Đã đăng bài kèm ảnh & Backlink lên Tumblr thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'tumblr',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
