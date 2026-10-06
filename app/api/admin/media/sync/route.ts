import { NextResponse } from 'next/server';
import { syncMediaToCloud } from '@/lib/storage/service';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetProvider = body.provider as 'cloudflare_r2' | 'supabase' | undefined;

    const result = await syncMediaToCloud(targetProvider);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
