import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getR2Config, syncLocalAssetsToR2, syncArticleImagesToR2, type R2Config } from '@/lib/storage/r2';
import { updateStorageSettings } from '@/lib/storage/service';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    let config: R2Config | null = null;

    if (body.cloudflare?.account_id && body.cloudflare?.access_key_id && body.cloudflare?.secret_access_key && body.cloudflare?.bucket_name) {
      config = {
        accountId: body.cloudflare.account_id,
        accessKeyId: body.cloudflare.access_key_id,
        secretAccessKey: body.cloudflare.secret_access_key,
        bucketName: body.cloudflare.bucket_name,
        publicDomain: body.cloudflare.public_domain || '',
      };

      // Persist to storage_settings
      await updateStorageSettings({
        provider: 'cloudflare_r2',
        cloudflare: body.cloudflare,
      });
    } else {
      config = await getR2Config();
    }

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudflare R2 is not configured. Please supply Account ID, Access Key ID, Secret Access Key, and Bucket Name.',
        },
        { status: 400 }
      );
    }

    // 1. Sync local assets (logos, favicons, uploads)
    const localResult = await syncLocalAssetsToR2(config);

    // 2. Sync post images if requested
    let postsResult = null;
    if (body.syncPosts !== false) {
      postsResult = await syncArticleImagesToR2(config, {
        maxPosts: body.maxPosts || 500,
        updateDatabase: true,
      });
    }

    const totalUploaded = localResult.uploadedCount + (postsResult?.uploadedCount || 0);
    const totalProcessed = localResult.totalProcessed + (postsResult?.totalProcessed || 0);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${totalUploaded} media assets with Cloudflare R2!`,
      totalProcessed,
      totalUploaded,
      local: localResult,
      posts: postsResult,
      publicDomain: config.publicDomain,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Synchronization failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
