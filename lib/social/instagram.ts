import type { Post } from '@/lib/types';
import { SITE_URL, postPath } from '@/lib/urls';
import type { ChannelShareResult } from './types';

const FB_GRAPH_VERSION = 'v21.0';

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL || 'https://www.miregalo.us').replace(/\/$/, '');
}

function buildPostUrl(post: Post): string {
  return `${getSiteUrl()}${postPath(post)}`;
}

function resolveAbsoluteImageUrl(post: Post): string | null {
  const raw =
    post.og_image ||
    post.hero_image ||
    post.items?.find((it) => it?.image)?.image ||
    '';
  if (!raw || !raw.trim()) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.trim();
  const siteUrl = getSiteUrl();
  return `${siteUrl}${raw.startsWith('/') ? '' : '/'}${raw.trim()}`;
}

/**
 * Converts any image URL (.webp, .png, .avif, .jpg) into an Instagram-compliant JPEG URL.
 * Instagram Graph API strictly requires JPEG format and aspect ratio between 4:5 (0.8) and 1.91:1.
 */
function toInstagramJpegUrl(rawUrl: string, forceSquareCrop = false): string {
  const isAlreadyJpeg = /\.(jpe?g)(\?.*)?$/i.test(rawUrl);
  if (isAlreadyJpeg && !forceSquareCrop) {
    return rawUrl;
  }
  const encoded = encodeURIComponent(rawUrl);
  if (forceSquareCrop) {
    return `https://wsrv.nl/?url=${encoded}&w=1080&h=1080&fit=cover&output=jpg&q=90`;
  }
  return `https://wsrv.nl/?url=${encoded}&w=1080&output=jpg&q=90`;
}

function getGraphHost(accessToken: string): string {
  const trimmed = accessToken.trim();
  if (trimmed.startsWith('IG')) {
    return `https://graph.instagram.com/${FB_GRAPH_VERSION}`;
  }
  return `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
}

export function formatInstagramCaption(post: Post, template?: string): string {
  const url = buildPostUrl(post);
  const title = post.title || '';
  const excerpt = post.excerpt || post.seo_description || '';

  let text: string;
  if (template && template.trim()) {
    text = template
      .replace(/\{title\}/g, title)
      .replace(/\{excerpt\}/g, excerpt)
      .replace(/\{url\}/g, url);
  } else {
    text = `🎁 ${title}\n\n${excerpt}\n\n👉 Descubre la guía completa en: ${url}\n\n#regalos #ideaspararegalar #miregalo #regalosoriginales #guiaDeRegalos`;
  }

  return text.length > 2150 ? text.slice(0, 2147) + '...' : text;
}

/**
 * Automatically resolves the Instagram Business/Creator Account ID (ig_user_id)
 * from either an Instagram Login token (IG...), a Facebook Page ID, or /me/accounts.
 */
export async function resolveInstagramAccountInfo(
  accessToken: string,
  igUserId?: string,
  facebookPageId?: string
): Promise<{
  igUserId: string | null;
  username?: string;
  name?: string;
  error?: string;
}> {
  const cleanToken = accessToken.trim();
  if (!cleanToken) {
    return { igUserId: null, error: 'Chưa nhập Instagram Access Token.' };
  }

  const host = getGraphHost(cleanToken);

  try {
    // 1. If token is an Instagram Login API token (IG...)
    if (cleanToken.startsWith('IG')) {
      const target = igUserId?.trim() || 'me';
      const res = await fetch(
        `${host}/${encodeURIComponent(target)}?fields=id,user_id,username,name&access_token=${encodeURIComponent(cleanToken)}`
      );
      const data = await res.json();
      if (res.ok && (data.user_id || data.id)) {
        return {
          igUserId: String(data.user_id || data.id),
          username: data.username,
          name: data.name,
        };
      }
      return {
        igUserId: igUserId?.trim() || null,
        error: data?.error?.message || 'Không kiểm tra được Instagram Token.',
      };
    }

    // 2. If user already provided an igUserId with a Facebook Graph token (EAA...), verify if it's an IG account or a FB Page ID
    if (igUserId && igUserId.trim()) {
      const candidate = igUserId.trim();
      const igRes = await fetch(
        `${host}/${encodeURIComponent(candidate)}?fields=id,username,name,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(cleanToken)}`
      );
      const igData = await igRes.json();
      if (igRes.ok) {
        // If the user accidentally pasted their Facebook Page ID into the IG User ID box, extract instagram_business_account!
        if (igData.instagram_business_account?.id) {
          return {
            igUserId: String(igData.instagram_business_account.id),
            username: igData.instagram_business_account.username,
            name: igData.instagram_business_account.name,
          };
        }
        if (igData.username || igData.id) {
          return {
            igUserId: String(igData.id),
            username: igData.username,
            name: igData.name,
          };
        }
      }
    }

    // 3. Try discovering via linked Facebook Page ID
    if (facebookPageId && facebookPageId.trim()) {
      const pageRes = await fetch(
        `${host}/${encodeURIComponent(facebookPageId.trim())}?fields=instagram_business_account{id,username,name}&access_token=${encodeURIComponent(cleanToken)}`
      );
      const pageData = await pageRes.json();
      if (pageRes.ok && pageData?.instagram_business_account?.id) {
        return {
          igUserId: String(pageData.instagram_business_account.id),
          username: pageData.instagram_business_account.username,
          name: pageData.instagram_business_account.name,
        };
      }
    }

    // 4. Try discovering across all Pages in /me/accounts
    const accountsRes = await fetch(
      `${host}/me/accounts?fields=id,name,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(cleanToken)}`
    );
    const accountsData = await accountsRes.json();
    if (accountsRes.ok && Array.isArray(accountsData?.data)) {
      const pageWithIg = accountsData.data.find((p: any) => p?.instagram_business_account?.id);
      if (pageWithIg?.instagram_business_account?.id) {
        return {
          igUserId: String(pageWithIg.instagram_business_account.id),
          username: pageWithIg.instagram_business_account.username,
          name: pageWithIg.instagram_business_account.name,
        };
      }
    }

    return {
      igUserId: igUserId?.trim() || null,
      error:
        'Không tìm thấy tài khoản Instagram Business/Creator liên kết với Token/Fanpage này. Hãy đảm bảo tài khoản Instagram đã chuyển sang chế độ Công việc (Professional/Business) và liên kết với Fanpage Facebook.',
    };
  } catch (err: any) {
    return {
      igUserId: igUserId?.trim() || null,
      error: err?.message || String(err),
    };
  }
}

async function createAndPublishIgContainer(
  host: string,
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<{ ok: boolean; mediaId?: string; permalink?: string; error?: string }> {
  // Step 1: Create media container
  const createRes = await fetch(`${host}/${encodeURIComponent(igUserId)}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData?.id) {
    return {
      ok: false,
      error: createData?.error?.message || `HTTP ${createRes.status}: Không tạo được container ảnh Instagram`,
    };
  }

  const creationId = String(createData.id);

  // Step 2: Poll container status briefly if needed
  for (let i = 0; i < 4; i++) {
    try {
      const statusRes = await fetch(
        `${host}/${encodeURIComponent(creationId)}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`
      );
      const statusData = await statusRes.json();
      const code = statusData?.status_code;
      if (code === 'FINISHED') break;
      if (code === 'ERROR' || code === 'EXPIRED') {
        return {
          ok: false,
          error: `Instagram xử lý ảnh thất bại (${statusData?.status || code})`,
        };
      }
    } catch {
      // Ignore status poll error and proceed
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Step 3: Publish media container
  const publishRes = await fetch(`${host}/${encodeURIComponent(igUserId)}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData?.id) {
    return {
      ok: false,
      error: publishData?.error?.message || `HTTP ${publishRes.status}: Không xuất bản được bài Instagram`,
    };
  }

  const mediaId = String(publishData.id);
  let permalink = 'https://www.instagram.com/';
  try {
    const linkRes = await fetch(
      `${host}/${encodeURIComponent(mediaId)}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`
    );
    const linkData = await linkRes.json();
    if (linkRes.ok && linkData?.permalink) {
      permalink = linkData.permalink;
    }
  } catch {}

  return { ok: true, mediaId, permalink };
}

/**
 * Publishes a post photo + caption to Instagram Business/Creator Feed
 */
export async function shareToInstagram(
  post: Post,
  igUserId: string,
  accessToken: string,
  template?: string,
  facebookPageId?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  const cleanToken = (accessToken || '').trim();

  if (!cleanToken) {
    return {
      channel: 'instagram',
      success: false,
      error: 'Thiếu Instagram Access Token.',
      timestamp,
    };
  }

  const rawImageUrl = resolveAbsoluteImageUrl(post);
  if (!rawImageUrl) {
    return {
      channel: 'instagram',
      success: false,
      error: 'Bài viết không có ảnh bìa (Instagram bắt buộc phải có ảnh).',
      timestamp,
    };
  }

  try {
    let targetUserId = (igUserId || '').trim();
    if (!targetUserId) {
      const resolved = await resolveInstagramAccountInfo(cleanToken, undefined, facebookPageId);
      if (!resolved.igUserId) {
        return {
          channel: 'instagram',
          success: false,
          error: resolved.error || 'Không xác định được Instagram Business User ID.',
          timestamp,
        };
      }
      targetUserId = resolved.igUserId;
    }

    const host = getGraphHost(cleanToken);
    const caption = formatInstagramCaption(post, template);

    // First attempt: convert to JPEG (preserving original aspect ratio)
    const primaryJpegUrl = toInstagramJpegUrl(rawImageUrl, false);
    let attempt = await createAndPublishIgContainer(host, targetUserId, cleanToken, primaryJpegUrl, caption);

    // Fallback: if Instagram rejects aspect ratio or image format, crop to 1080x1080 square JPEG
    if (!attempt.ok) {
      const squareJpegUrl = toInstagramJpegUrl(rawImageUrl, true);
      attempt = await createAndPublishIgContainer(host, targetUserId, cleanToken, squareJpegUrl, caption);
    }

    if (!attempt.ok) {
      return {
        channel: 'instagram',
        success: false,
        error: `Instagram API Error: ${attempt.error}`,
        timestamp,
      };
    }

    return {
      channel: 'instagram',
      success: true,
      post_id: attempt.mediaId,
      url: attempt.permalink,
      message: 'Đã đăng ảnh kèm bài viết lên Instagram thành công!',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'instagram',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}

/**
 * Verifies Instagram connection and auto-resolves Instagram Business Account ID & username
 */
export async function testInstagramConnection(
  igUserId: string,
  accessToken: string,
  facebookPageId?: string
): Promise<{
  success: boolean;
  igUserId?: string;
  username?: string;
  name?: string;
  error?: string;
}> {
  const resolved = await resolveInstagramAccountInfo(accessToken, igUserId, facebookPageId);
  if (!resolved.igUserId) {
    return {
      success: false,
      error: resolved.error || 'Không kết nối được tới tài khoản Instagram.',
    };
  }
  return {
    success: true,
    igUserId: resolved.igUserId,
    username: resolved.username,
    name: resolved.name,
  };
}
