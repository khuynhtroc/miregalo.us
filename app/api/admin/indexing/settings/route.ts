import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIndexingSettings, saveIndexingSettings } from '@/lib/indexing/google';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await getIndexingSettings();
    return NextResponse.json({
      settings: {
        ...settings,
        private_key: settings.private_key ? '•••••••• [Configured RSA Private Key] ••••••••' : '',
        has_private_key: Boolean(settings.private_key),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error reading indexing settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const current = await getIndexingSettings();

    let client_email = body.client_email !== undefined ? String(body.client_email).trim() : current.client_email;
    let private_key = current.private_key || '';

    // Handle uploaded/pasted Service Account JSON
    if (body.service_account_json && typeof body.service_account_json === 'string') {
      const trimmed = body.service_account_json.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.client_email) client_email = String(parsed.client_email).trim();
          if (parsed.private_key) private_key = String(parsed.private_key).trim();
        } catch {
          return NextResponse.json({ error: 'Định dạng Service Account JSON không hợp lệ' }, { status: 400 });
        }
      }
    }

    // Direct private key update if not masked
    if (body.private_key && typeof body.private_key === 'string') {
      const pk = body.private_key.trim();
      if (!pk.includes('••••••••')) {
        private_key = pk;
      }
    }

    const updated = await saveIndexingSettings({
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : current.enabled,
      auto_submit_on_publish:
        body.auto_submit_on_publish !== undefined ? Boolean(body.auto_submit_on_publish) : current.auto_submit_on_publish,
      ping_sitemap: body.ping_sitemap !== undefined ? Boolean(body.ping_sitemap) : current.ping_sitemap,
      ping_indexnow: body.ping_indexnow !== undefined ? Boolean(body.ping_indexnow) : current.ping_indexnow,
      client_email,
      private_key,
      indexnow_key: body.indexnow_key !== undefined ? String(body.indexnow_key).trim() : current.indexnow_key,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình Google Indexing thành công',
      settings: {
        ...updated,
        private_key: updated.private_key ? '•••••••• [Configured RSA Private Key] ••••••••' : '',
        has_private_key: Boolean(updated.private_key),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error saving indexing settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
