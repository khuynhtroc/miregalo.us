import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIndexingSettings, getIndexingAccessToken } from '@/lib/indexing/google';
import { SITE_URL } from '@/lib/urls';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const current = await getIndexingSettings();

    let client_email = body.client_email?.trim() || current.client_email;
    let private_key = body.private_key?.trim() || current.private_key;

    // Support pasted JSON in test request
    if (body.service_account_json && typeof body.service_account_json === 'string') {
      try {
        const parsed = JSON.parse(body.service_account_json.trim());
        if (parsed.client_email) client_email = parsed.client_email.trim();
        if (parsed.private_key) private_key = parsed.private_key.trim();
      } catch {}
    }

    if (!client_email) {
      return NextResponse.json({
        success: false,
        message: 'Chưa có Client Email của Service Account. Vui lòng nhập email hoặc dán file JSON.',
      });
    }

    if (!private_key || private_key.includes('••••••••')) {
      private_key = current.private_key;
    }

    if (!private_key) {
      return NextResponse.json({
        success: false,
        message: 'Chưa có RSA Private Key. Vui lòng nhập private key hoặc dán file JSON Service Account.',
      });
    }

    // 1. Test OAuth token generation
    let token: string;
    try {
      token = await getIndexingAccessToken(client_email, private_key);
    } catch (tokenErr: any) {
      return NextResponse.json({
        success: false,
        step: 'oauth_token',
        message: `Tạo Access Token thất bại: ${tokenErr?.message || tokenErr}`,
      });
    }

    // 2. Test Google Indexing API access for site URL
    const testUrl = `${SITE_URL}/`;
    const checkApi = `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(testUrl)}`;
    const checkRes = await fetch(checkApi, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const checkData = await checkRes.json().catch(() => ({}));

    if (checkRes.ok) {
      return NextResponse.json({
        success: true,
        message: `Kết nối thành công! Service Account đã được xác thực và có quyền kiểm tra Indexing trên Google Search Console (${testUrl}).`,
        details: checkData,
      });
    }

    // If 404, it means Google Indexing API is reachable and authorized, but this specific URL has no previous notifications
    if (checkRes.status === 404) {
      return NextResponse.json({
        success: true,
        message: `Xác thực Google Indexing API thành công 100%! (Chưa có lịch sử submit URL nào trước đó cho ${testUrl}).`,
      });
    }

    if (checkRes.status === 403) {
      const errMsg = (checkData as any)?.error?.message || 'Permission denied';
      return NextResponse.json({
        success: false,
        step: 'ownership_permission',
        code: 'PERMISSION_DENIED',
        message: `Tạo token Google OAuth thành công, nhưng Service Account (${client_email}) chưa được phân quyền Owner trên Google Search Console cho website ${SITE_URL}. Vui lòng vào Search Console > Cài đặt (Settings) > Người dùng & quyền (Users & permissions) > Thêm người dùng "${client_email}" với vai trò Chủ sở hữu (Owner).`,
        raw: errMsg,
      });
    }

    return NextResponse.json({
      success: false,
      step: 'api_check',
      message: `Google Indexing API phản hồi mã ${checkRes.status}: ${(checkData as any)?.error?.message || 'Lỗi không xác định'}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error testing connection';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
