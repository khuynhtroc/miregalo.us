import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getIndexingSettings, getIndexingLogs, submitUrlToGoogle } from '@/lib/indexing/google';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [settings, logs] = await Promise.all([
      getIndexingSettings(),
      getIndexingLogs(),
    ]);

    // Mask private key for security in UI response
    const maskedSettings = {
      ...settings,
      private_key: settings.private_key ? '•••••••• [Configured RSA Private Key] ••••••••' : '',
    };

    return NextResponse.json({
      settings: maskedSettings,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching indexing data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls
      : body.url
      ? [body.url]
      : [];

    const type = body.type === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED';

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    const results = [];
    for (const url of urls.slice(0, 100)) {
      const cleanUrl = url.trim();
      if (!cleanUrl) continue;
      const res = await submitUrlToGoogle(cleanUrl, type);
      results.push({ url: cleanUrl, ...res });
      // Minor throttle between submissions
      if (urls.length > 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const logs = await getIndexingLogs();

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error submitting URLs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
