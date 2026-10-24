import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const DEVTO_API = 'https://dev.to/api';

export async function testDevToConnection(
  apiKey: string
): Promise<{ success: boolean; username?: string; name?: string; error?: string }> {
  try {
    const cleanKey = (apiKey || '').trim();
    if (!cleanKey) {
      return { success: false, error: 'Vui lòng nhập Dev.to API Key' };
    }

    const res = await fetch(`${DEVTO_API}/users/me`, {
      headers: {
        'api-key': cleanKey,
        Accept: 'application/vnd.forem.api-v1+json',
        'User-Agent': 'MiregaloBot/1.0',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.username) {
      return {
        success: false,
        error: data?.error || `Dev.to API (${res.status}): API Key không hợp lệ`,
      };
    }

    return {
      success: true,
      username: data.username,
      name: data.name || data.username,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes an SEO article with canonical_url and cover image to Dev.to (Forem).
 */
export async function shareToDevTo(
  post: Post,
  apiKey: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanKey = (apiKey || '').trim();
    if (!cleanKey) {
      return {
        channel: 'devto',
        success: false,
        error: 'Thiếu Dev.to API Key',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const rawImg = post.og_image || post.hero_image || post.items?.find((it) => it?.image)?.image || '';
    const imageUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`) : '';

    const cleanIntroText = (post.intro_html || '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const itemsPreview = Array.isArray(post.items)
      ? post.items
          .slice(0, 5)
          .map((it, idx) => `### ${idx + 1}. ${it.heading || 'Idea recomendada'}\n${(it.description_html || (it as any).body_html || '').replace(/<[^>]+>/g, '').trim()}`)
          .join('\n\n')
      : '';

    const bodyMarkdown = [
      excerpt ? `> ${excerpt}` : '',
      cleanIntroText,
      itemsPreview,
      `---`,
      `🎁 **Descubre la guía completa y todas las recomendaciones en [Miregalo: ${title}](${postUrl})**`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const res = await fetch(`${DEVTO_API}/articles`, {
      method: 'POST',
      headers: {
        'api-key': cleanKey,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.forem.api-v1+json',
        'User-Agent': 'MiregaloBot/1.0',
      },
      body: JSON.stringify({
        article: {
          title,
          published: true,
          body_markdown: bodyMarkdown,
          tags: ['regalos', 'lifestyle', 'spanish', 'cultura'],
          canonical_url: postUrl,
          description: excerpt.slice(0, 150),
          ...(imageUrl ? { main_image: imageUrl } : {}),
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      return {
        channel: 'devto',
        success: false,
        error: `Dev.to API (${res.status}): ${data?.error || JSON.stringify(data)}`,
        timestamp,
      };
    }

    return {
      channel: 'devto',
      success: true,
      post_id: String(data.id),
      url: data.url,
      message: 'Đã đăng bài kèm thẻ Canonical SEO lên Dev.to thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'devto',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
