import { NextResponse } from 'next/server';
import { getMediaFiles, createMediaFile, getStorageSettings } from '@/lib/storage/service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const type = (searchParams.get('type') as any) || 'all';
    const provider = (searchParams.get('provider') as any) || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getMediaFiles({ q, type, provider, limit, offset });
    const settings = await getStorageSettings();

    return NextResponse.json({
      ...result,
      rows: result.files,
      settings: {
        activeProvider: settings.provider,
        autoSync: settings.auto_sync,
        lastSyncedAt: settings.last_synced_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list media' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, originalName, mimeType, sizeBytes, externalUrl, altText, base64 } = body;

    if (!name) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    let buffer: Buffer | undefined;
    if (base64) {
      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    const created = await createMediaFile({
      name,
      originalName: originalName || name,
      mimeType: mimeType || 'image/jpeg',
      sizeBytes: sizeBytes || (buffer ? buffer.length : 102400),
      buffer,
      externalUrl,
      altText,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to upload media file' }, { status: 500 });
  }
}
