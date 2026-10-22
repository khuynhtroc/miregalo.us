import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0';

/**
 * Verifies Facebook Page Access Token and retrieves Page Name.
 * Performs deep diagnostics: checks whether token is Page Token or User Token,
 * and extracts full Facebook error codes and actionable hints.
 */
export async function testFacebookConnection(
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; page_name?: string; error?: string }> {
  try {
    const cleanId = (pageId || '').trim().replace(/['"]/g, '');
    const cleanToken = (accessToken || '').trim().replace(/['"]/g, '');
    if (!cleanId || !cleanToken) {
      return { success: false, error: 'Page ID hoặc Access Token chưa được điền đầy đủ' };
    }

    // 1. Inspect what this token represents via /me
    let meData: any = null;
    try {
      const meRes = await fetch(`${FB_GRAPH_API}/me?fields=id,name`, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      });
      meData = await meRes.json();
    } catch {}

    // Case A: The token is directly a Page Access Token for this Page
    if (meData?.id && String(meData.id) === cleanId) {
      return {
        success: true,
        page_name: meData.name || cleanId,
      };
    }

    // Case B: Token belongs to a personal User profile, NOT a Page!
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
            error: `Token bạn nhập là User Token cá nhân ("${meData.name}"), KHÔNG PHẢI Page Access Token của Fanpage "${found.name}". Vui lòng chọn Page "${found.name}" khi tạo Token trong Graph API Explorer để lấy Page Access Token vĩnh viễn.`,
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

    // 2. Query Page directly by ID with clean fields (NEVER request 'link' as it requires App Review)
    const res = await fetch(`${FB_GRAPH_API}/${cleanId}?fields=id,name`, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    const data = await res.json();

    if (res.ok && data?.id) {
      return {
        success: true,
        page_name: data.name || cleanId,
      };
    }

    // 3. Fallback: query with access_token query param
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
        detail += '. Gợi ý: Token đã hết hạn hoặc định dạng không đúng. Vui lòng tạo lại Page Access Token.';
      } else if (msg.toLowerCase().includes('invalid request')) {
        detail += '. Gợi ý: Kiểm tra xem Token có quyền pages_manage_posts / pages_read_engagement và được cấp cho đúng Fanpage chưa.';
      }

      return { success: false, error: detail };
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

    let message = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n${excerpt}\n\n👉 Descubre todas las ideas y detalles aquí: ${postUrl}`;

    // Keep the article URL in the message text so it remains visible in the
    // post body. Sending the same URL again as the separate `link` parameter
    // can make Facebook render it only as an attachment preview.
    const params = new URLSearchParams({ message });

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
