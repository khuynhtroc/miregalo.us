import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const LINKEDIN_API = 'https://api.linkedin.com/v2';

/**
 * Resolves LinkedIn Author URN (urn:li:person:... or urn:li:organization:...)
 * If authorUrn is empty, automatically queries /v2/userinfo (OpenID Connect) or /v2/me.
 */
export async function resolveLinkedInAuthorUrn(
  accessToken: string,
  authorUrnOrId?: string
): Promise<{ urn: string | null; name?: string; error?: string }> {
  const cleanToken = (accessToken || '').trim();
  if (!cleanToken) {
    return { urn: null, error: 'Vui lòng nhập LinkedIn Access Token.' };
  }

  const rawAuthor = (authorUrnOrId || '').trim();
  if (rawAuthor.startsWith('urn:li:person:') || rawAuthor.startsWith('urn:li:organization:')) {
    return { urn: rawAuthor };
  }
  if (/^\d+$/.test(rawAuthor)) {
    // Numeric ID is typically a LinkedIn Company / Organization Page ID
    return { urn: `urn:li:organization:${rawAuthor}` };
  }

  try {
    // 1. Try OpenID Connect /v2/userinfo (standard on all new LinkedIn Developer apps with openid + profile + w_member_social)
    const userInfoRes = await fetch(`${LINKEDIN_API}/userinfo`, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    if (userInfoRes.ok) {
      const info = await userInfoRes.json();
      if (info?.sub) {
        return {
          urn: `urn:li:person:${info.sub}`,
          name: info.name || info.given_name || info.sub,
        };
      }
    }

    // 2. Fallback to legacy /v2/me
    const meRes = await fetch(`${LINKEDIN_API}/me`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    const meData = await meRes.json();
    if (meRes.ok && meData?.id) {
      const fullName = [meData.localizedFirstName, meData.localizedLastName].filter(Boolean).join(' ');
      return {
        urn: `urn:li:person:${meData.id}`,
        name: fullName || meData.id,
      };
    }

    return {
      urn: rawAuthor ? `urn:li:person:${rawAuthor}` : null,
      error:
        meData?.message ||
        'Không tự lấy được LinkedIn Member ID. Hãy cấp quyền openid, profile, w_member_social trong LinkedIn Developer Portal (hoặc điền Organization ID nếu đăng lên Company Page).',
    };
  } catch (err: any) {
    return { urn: null, error: err?.message || String(err) };
  }
}

export async function testLinkedInConnection(
  accessToken: string,
  authorUrn?: string
): Promise<{ success: boolean; urn?: string; name?: string; error?: string }> {
  const resolved = await resolveLinkedInAuthorUrn(accessToken, authorUrn);
  if (!resolved.urn) {
    return { success: false, error: resolved.error || 'Kết nối LinkedIn thất bại' };
  }
  return {
    success: true,
    urn: resolved.urn,
    name: resolved.name || resolved.urn,
  };
}

/**
 * Publishes an Article Link post to LinkedIn Profile or Company Page via UGC Posts API.
 */
export async function shareToLinkedIn(
  post: Post,
  accessToken: string,
  authorUrn?: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const resolved = await resolveLinkedInAuthorUrn(accessToken, authorUrn);
    if (!resolved.urn) {
      return {
        channel: 'linkedin',
        success: false,
        error: resolved.error || 'Chưa xác định được LinkedIn Author URN',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const commentary = (template || '🎁 {title}\n\n{excerpt}\n\n👉 {url}\n\n#regalos #ideaspararegalar #miregalo')
      .replace(/\{title\}/g, title)
      .replace(/\{excerpt\}/g, excerpt)
      .replace(/\{url\}/g, postUrl)
      .slice(0, 2900);

    const payload = {
      author: resolved.urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: commentary,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              originalUrl: postUrl,
              title: { text: title.slice(0, 200) },
              description: { text: excerpt.slice(0, 250) },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        channel: 'linkedin',
        success: false,
        error: `LinkedIn API (${res.status}): ${data?.message || JSON.stringify(data)}`,
        timestamp,
      };
    }

    const postId = data?.id || res.headers.get('x-restli-id') || '';
    return {
      channel: 'linkedin',
      success: true,
      post_id: postId,
      url: postId ? `https://www.linkedin.com/feed/update/${postId}/` : 'https://www.linkedin.com/feed/',
      message: 'Đã đăng bài kèm thẻ Link Preview lên LinkedIn thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'linkedin',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
