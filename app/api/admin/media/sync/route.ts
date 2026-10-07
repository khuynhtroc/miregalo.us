import { NextResponse } from 'next/server';
import { syncMediaToCloud } from '@/lib/storage/service';
import { getR2Config, syncLocalAssetsToR2, syncArticleImagesToR2 } from '@/lib/storage/r2';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetProvider = body.provider as 'cloudflare_r2' | 'supabase' | undefined;

    if (targetProvider === 'cloudflare_r2') {
      const r2Config = await getR2Config();
      if (r2Config) {
        const localRes = await syncLocalAssetsToR2(r2Config);
        const postsRes = await syncArticleImagesToR2(r2Config, { maxPosts: 200 });
        const totalUploaded = localRes.uploadedCount + postsRes.uploadedCount;
        return NextResponse.json({
          success: true,
          provider: 'cloudflare_r2',
          syncedCount: totalUploaded,
          message: `Synced ${totalUploaded} media files to Cloudflare R2!`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const result = await syncMediaToCloud(targetProvider);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
