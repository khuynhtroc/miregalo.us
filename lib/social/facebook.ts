import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';
import { buildOptimizedFacebookStatus } from './seo-content-generator';

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0';
const DEFAULT_COVER = 'https://www.miregalo.us/images/miregalo-cover.jpg';

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
        if (subcode === 460) {
          detail +=
            '. Nguyên nhân: Phiên đăng nhập Facebook của tài khoản quản trị viên đã bị Facebook thu hồi (do tài khoản cá nhân vừa đổi mật khẩu Facebook, đăng xuất khỏi các thiết bị, hoặc Facebook kích hoạt kiểm tra bảo mật - Mã 190, subcode 460). Hãy vào Meta Graph API Explorer tạo lại User Token mới, dán vào ô Token bên dưới rồi bấm "Lưu Cấu Hình" để hệ thống tự động cấp lại Token Vĩnh Viễn!';
        } else {
          detail +=
            '. Nguyên nhân: Token ngắn hạn từ Graph API Explorer đã hết hạn hoặc không còn hiệu lực. Hãy lấy lại User Token mới trong Graph API Explorer, dán vào ô bên dưới rồi bấm "Lưu Cấu Hình" để hệ thống tự động đổi sang Token Vĩnh Viễn!';
        }
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
 * Publishes a photo post (Featured Image + 5-pillar SEO GEO Caption) to Facebook Fanpage.
 * Replaces the old URL link card post format with full-size photo + high-engagement caption.
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

    // 1. Chuẩn bị nội dung Caption chuẩn 5 trụ cột & SEO GEO
    let message = '';
    const isAutoOrBlank =
      !template ||
      template.includes('{auto_seo}') ||
      template.trim().startsWith('🎁 {title}') ||
      template.length < 50;

    if (isAutoOrBlank) {
      const generated = buildOptimizedFacebookStatus(
        { ...post, urlPath: postPath(post), url: postUrl },
        SITE_URL
      );
      if (template && template.includes('{auto_seo}')) {
        message = template
          .replace(/{auto_seo}/g, generated)
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl);
      } else {
        message = generated;
      }
    } else {
      message = template
        .replace(/{title}/g, title)
        .replace(/{excerpt}/g, excerpt)
        .replace(/{url}/g, postUrl);
    }

    // 2. Trích xuất và chuẩn hóa Ảnh đại diện (Featured Image / Hero Image) của bài viết
    let rawCover = (
      post.hero_image ||
      post.og_image ||
      (Array.isArray(post.items) ? post.items.find((it: any) => it?.image)?.image : '') ||
      ''
    ).trim();

    if (!rawCover && post.content_html) {
      const htmlImgMatch = String(post.content_html).match(/<img[^>]+src=["']([^"']+)["']/i);
      rawCover = (htmlImgMatch && htmlImgMatch[1]) || '';
    }

    let photoUrl = rawCover || DEFAULT_COVER;
    if (photoUrl) {
      photoUrl = photoUrl
        .replace(/^https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//i, 'https://media.miregalo.us/media/')
        .replace(/^https?:\/\/loveable\.appspot\.com\//i, 'https://media.miregalo.us/media/')
        .replace(/^https?:\/\/cdn\.loveable\.us\//i, 'https://media.miregalo.us/media/');

      if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
        photoUrl = `${SITE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
      }
    }

    // Facebook /photos endpoint yêu cầu định dạng JPEG/PNG/GIF; tự động chuyển đổi file .webp qua wsrv.nl
    if (/\.webp(\?|$)/i.test(photoUrl)) {
      photoUrl = `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}&output=jpg&q=90`;
    }

    // Hàm gọi đăng ảnh qua /photos
    const postPhoto = async (targetImgUrl: string) => {
      const photoParams = new URLSearchParams({
        url: targetImgUrl,
        caption: message,
        published: 'true',
      });
      const r = await fetch(`${FB_GRAPH_API}/${cleanId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${cleanToken}`,
        },
        body: photoParams.toString(),
      });
      const d = await r.json().catch(() => ({}));
      return { res: r, data: d };
    };

    // 3. ĐĂNG DẠNG ẢNH ĐẠI DIỆN + DÒNG CAPTION (Photo Post - KHÔNG ĐĂNG DẠNG URL CARD)
    let { res, data } = await postPhoto(photoUrl);

    // Fallback: Thử với ảnh bìa mặc định nếu URL ảnh chính bị Facebook từ chối tải
    if ((!res.ok || data.error) && photoUrl !== DEFAULT_COVER) {
      ({ res, data } = await postPhoto(DEFAULT_COVER));
    }

    // Fallback cấp 2: Nếu cả 2 lượt đăng ảnh qua /photos đều lỗi, đăng dạng bài viết văn bản (Feed Text)
    // TUYỆT ĐỐI KHÔNG gửi param 'link' để không bị Facebook biến thành Link Post dạng URL cũ
    if (!res.ok || data.error) {
      const feedParams = new URLSearchParams({
        message,
      });
      res = await fetch(`${FB_GRAPH_API}/${cleanId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${cleanToken}`,
        },
        body: feedParams.toString(),
      });
      data = await res.json().catch(() => ({}));
    }

    if (!res.ok || data.error) {
      const fbErr = data?.error;
      let errMsg = fbErr
        ? `${fbErr.message}${fbErr.code ? ` (Mã lỗi: ${fbErr.code}${fbErr.error_subcode ? `, subcode: ${fbErr.error_subcode}` : ''})` : ''}`
        : 'Lỗi khi đăng bài lên Facebook Fanpage';
      if (fbErr?.code === 190) {
        if (fbErr?.error_subcode === 460) {
          errMsg += ' - Phiên đăng nhập Facebook của tài khoản quản trị vừa bị Facebook hủy bỏ (do đổi mật khẩu hoặc bảo mật). Vui lòng tạo User Token mới trong Graph API Explorer và bấm Lưu Cấu Hình để cấp lại Token Vĩnh Viễn.';
        } else {
          errMsg += ' - Token Facebook đã hết hạn. Hãy cập nhật Token mới trong Cài Đặt.';
        }
      }
      return {
        channel: 'facebook',
        success: false,
        error: errMsg,
        timestamp,
      };
    }

    const postId = data.post_id || data.id;
    return {
      channel: 'facebook',
      success: true,
      post_id: postId,
      url: `https://facebook.com/${postId}`,
      message: 'Đăng ảnh đại diện kèm Caption lên Facebook Fanpage thành công',
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
