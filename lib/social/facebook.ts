import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0';

/**
 * Automatically exchanges a short-lived User/Page token or long-lived User token
 * into a NEVER-EXPIRING (Permanent) Facebook Page Access Token whenever possible.
 */
export async function resolvePermanentFacebookPageToken(
  pageId: string,
  inputToken: string,
  appId?: string,
  appSecret?: string
): Promise<{ token: string; exchanged: boolean; isPermanent?: boolean }> {
  const cleanPageId = (pageId || '').trim().replace(/['"]/g, '');
  let currentToken = (inputToken || '').trim().replace(/['"]/g, '');
  if (!cleanPageId || !currentToken) {
    return { token: currentToken, exchanged: false };
  }

  let exchanged = false;
  const cleanAppId = (appId || '').trim();
  const cleanAppSecret = (appSecret || '').trim();

  // Step 1: If App ID + App Secret are provided, exchange 1-hour token for 60-day token first
  if (cleanAppId && cleanAppSecret) {
    try {
      const exchangeUrl = new URL(`${FB_GRAPH_API}/oauth/access_token`);
      exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token');
      exchangeUrl.searchParams.set('client_id', cleanAppId);
      exchangeUrl.searchParams.set('client_secret', cleanAppSecret);
      exchangeUrl.searchParams.set('fb_exchange_token', currentToken);
      const exRes = await fetch(exchangeUrl.toString());
      const exData = await exRes.json();
      if (exRes.ok && exData?.access_token) {
        currentToken = exData.access_token;
        exchanged = true;
      }
    } catch {}
  }

  // Step 2: Check if currentToken can retrieve a Page Access Token from /me/accounts or /{pageId}?fields=access_token
  try {
    const pageRes = await fetch(`${FB_GRAPH_API}/${cleanPageId}?fields=id,name,access_token`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const pageData = await pageRes.json();
    if (pageRes.ok && pageData?.access_token) {
      currentToken = pageData.access_token;
      exchanged = true;
    } else {
      const accRes = await fetch(`${FB_GRAPH_API}/me/accounts?fields=id,name,access_token`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const accData = await accRes.json();
      const found = (accData?.data || []).find((p: any) => String(p.id) === cleanPageId);
      if (found?.access_token) {
        currentToken = found.access_token;
        exchanged = true;
      }
    }
  } catch {}

  return { token: currentToken, exchanged };
}

/**
 * Verifies Facebook Page Access Token and retrieves Page Name + Expiration status.
 */
export async function testFacebookConnection(
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; page_name?: string; is_permanent?: boolean; expires_at?: number; error?: string }> {
  try {
    const cleanId = (pageId || '').trim().replace(/['"]/g, '');
    const cleanToken = (accessToken || '').trim().replace(/['"]/g, '');
    if (!cleanId || !cleanToken) {
      return { success: false, error: 'Page ID hoặc Access Token chưa được điền đầy đủ' };
    }

    // Check token expiration metadata via /debug_token
    let expiresAt: number | undefined;
    try {
      const dbgRes = await fetch(
        `${FB_GRAPH_API}/debug_token?input_token=${encodeURIComponent(cleanToken)}&access_token=${encodeURIComponent(cleanToken)}`
      );
      const dbgData = await dbgRes.json();
      if (dbgData?.data && typeof dbgData.data.expires_at === 'number') {
        expiresAt = dbgData.data.expires_at;
      }
    } catch {}

    // 1. Inspect what this token represents via /me
    let meData: any = null;
    try {
      const meRes = await fetch(`${FB_GRAPH_API}/me?fields=id,name`, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      });
      meData = await meRes.json();
    } catch {}

    const formatExpiryNotice = (baseName: string) => {
      if (expiresAt === 0) return `${baseName} · Token Vĩnh Viễn (Không bao giờ hết hạn)`;
      if (expiresAt && expiresAt > 0) {
        const expDate = new Date(expiresAt * 1000).toLocaleString();
        return `${baseName} · ⚠️ Token ngắn hạn (Hết hạn lúc ${expDate} - Hãy nhập App Secret bên dưới rồi bấm Lưu để tự động đổi sang Token Vĩnh Viễn!)`;
      }
      return baseName;
    };

    // Case A: The token is directly a Page Access Token for this Page
    if (meData?.id && String(meData.id) === cleanId) {
      return {
        success: true,
        page_name: formatExpiryNotice(meData.name || cleanId),
        is_permanent: expiresAt === 0,
        expires_at: expiresAt,
      };
    }

    // Case B: Token belongs to a personal User profile
    if (meData?.id && String(meData.id) !== cleanId && !meData?.error) {
      try {
        const accountsRes = await fetch(`${FB_GRAPH_API}/me/accounts?fields=id,name`, {
          headers: { Authorization: `Bearer ${cleanToken}` },
        });
        const accountsData = await accountsRes.json();
        const pages = accountsData?.data || [];
        const found = pages.find((p: any) => String(p.id) === cleanId);
        if (found) {
          return {
            success: false,
            error: `Token bạn nhập là User Token cá nhân ("${meData.name}"). Hãy bấm nút "💾 Lưu Cấu Hình" để hệ thống tự động trích xuất Page Access Token của Fanpage "${found.name}"!`,
          };
        } else {
          const list = pages.map((p: any) => `"${p.name}" (${p.id})`).join(', ');
          return {
            success: false,
            error: `Token cá nhân "${meData.name}" không quản lý Fanpage ID ${cleanId}. Các Fanpage tài khoản này có quyền: ${list || 'Không có'}.`,
          };
        }
      } catch {}
    }

    // 2. Query Page directly by ID
    const res = await fetch(`${FB_GRAPH_API}/${cleanId}?fields=id,name`, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    const data = await res.json();

    if (res.ok && data?.id) {
      return {
        success: true,
        page_name: formatExpiryNotice(data.name || cleanId),
        is_permanent: expiresAt === 0,
        expires_at: expiresAt,
      };
    }

    if (!res.ok) {
      const fbErr = data?.error || meData?.error;
      const msg = fbErr?.message || 'Không thể xác thực Facebook Page';
      const code = fbErr?.code;
      const subcode = fbErr?.error_subcode;
      const userMsg = fbErr?.error_user_msg || fbErr?.error_user_title;

      let detail = msg;
      if (code) detail += ` [Mã lỗi: ${code}${subcode ? `, subcode: ${subcode}` : ''}]`;
      if (userMsg) detail += ` - ${userMsg}`;

      if (code === 190) {
        detail +=
          '. Nguyên nhân: Token ngắn hạn (1 giờ) từ Graph API Explorer đã hết hạn. Hãy lấy lại Token mới trong Graph API Explorer và điền thêm App Secret bên dưới rồi bấm Lưu Cấu Hình để hệ thống tự động đổi sang Token Vĩnh Viễn không bao giờ hết hạn!';
      }

      return { success: false, error: detail };
    }

    return {
      success: true,
      page_name: formatExpiryNotice(data.name || cleanId),
      is_permanent: expiresAt === 0,
      expires_at: expiresAt,
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
    const cleanId = (pageId || '').trim().replace(/['"]/g, '');
    const cleanToken = (accessToken || '').trim().replace(/['"]/g, '');
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

    const message = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n${excerpt}\n\n👉 Descubre todas las ideas y detalles aquí: ${postUrl}`;

    // Warm Facebook's OpenGraph cache so the first share of an older URL always renders its og:image
    try {
      await fetch(`${FB_GRAPH_API}/?id=${encodeURIComponent(postUrl)}&scrape=true`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanToken}` },
      });
    } catch {}

    const params = new URLSearchParams({
      message,
      link: postUrl,
    });

    const res = await fetch(`${FB_GRAPH_API}/${cleanId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${cleanToken}`,
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      const fbErr = data.error;
      const errMsg = fbErr
        ? `${fbErr.message}${fbErr.code ? ` (Mã lỗi: ${fbErr.code})` : ''}`
        : 'Lỗi khi đăng bài lên Facebook Fanpage';
      return {
        channel: 'facebook',
        success: false,
        error: errMsg,
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
