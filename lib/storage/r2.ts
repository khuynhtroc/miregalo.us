import 'server-only';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { getStorageSettings, updateStorageSettings } from './service';
import type { CloudStorageSettings, MediaFile } from '@/lib/types';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

/** Get active Cloudflare R2 configuration from env or database */
export async function getR2Config(): Promise<R2Config | null> {
  // 1. Check environment variables first
  const envAccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const envAccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const envSecretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const envBucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
  const envDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;

  if (envAccountId && envAccessKey && envSecretKey && envBucket) {
    return {
      accountId: envAccountId.trim(),
      accessKeyId: envAccessKey.trim(),
      secretAccessKey: envSecretKey.trim(),
      bucketName: envBucket.trim(),
      publicDomain: (envDomain || `https://${envBucket}.r2.cloudflarestorage.com`).trim().replace(/\/+$/, ''),
    };
  }

  // 2. Check database storage_settings
  const settings = await getStorageSettings();
  const cf = settings.cloudflare;
  if (
    cf?.account_id &&
    cf?.access_key_id &&
    cf?.secret_access_key &&
    cf?.bucket_name &&
    !cf.account_id.includes('test') &&
    !cf.secret_access_key.includes('••••')
  ) {
    return {
      accountId: cf.account_id.trim(),
      accessKeyId: cf.access_key_id.trim(),
      secretAccessKey: cf.secret_access_key.trim(),
      bucketName: cf.bucket_name.trim(),
      publicDomain: (cf.public_domain || '').trim().replace(/\/+$/, ''),
    };
  }

  return null;
}

/** Create an S3Client instance targeting Cloudflare R2 */
export function getR2Client(config: R2Config): S3Client {
  const cleanAccountId = config.accountId.trim();
  const endpoint = `https://${cleanAccountId}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId.trim(),
      secretAccessKey: config.secretAccessKey.trim(),
    },
  });
}

/** Test connectivity to Cloudflare R2 bucket */
export async function testR2Connection(config: R2Config): Promise<{
  success: boolean;
  message: string;
  keyCount?: number;
}> {
  try {
    const client = getR2Client(config);
    const cmd = new ListObjectsV2Command({
      Bucket: config.bucketName.trim(),
      MaxKeys: 1,
    });
    const res = await client.send(cmd);
    return {
      success: true,
      message: `Connection successful! Connected to Cloudflare R2 bucket "${config.bucketName}".`,
      keyCount: res.KeyCount ?? 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      success: false,
      message: `Failed to connect to Cloudflare R2: ${msg}`,
    };
  }
}

/** Helper to detect MIME type from extension or fallback */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    case '.ico':
      return 'image/x-icon';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/** Upload buffer to Cloudflare R2 */
export async function uploadBufferToR2(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string,
  config: R2Config
): Promise<string> {
  const client = getR2Client(config);
  const cleanKey = key.replace(/^\/+/, '');
  const cmd = new PutObjectCommand({
    Bucket: config.bucketName.trim(),
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await client.send(cmd);

  const domain = config.publicDomain ? config.publicDomain.replace(/\/+$/, '') : `https://${config.bucketName}.r2.cloudflarestorage.com`;
  return `${domain}/${cleanKey}`;
}

export interface SyncResult {
  success: boolean;
  totalProcessed: number;
  uploadedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
  publicDomain: string;
}

/**
 * Synchronize local website assets (public/images, public/uploads) to Cloudflare R2
 */
export async function syncLocalAssetsToR2(config: R2Config): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    totalProcessed: 0,
    uploadedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
    publicDomain: config.publicDomain,
  };

  const localDirs = [
    { dir: path.join(process.cwd(), 'public', 'images'), prefix: 'images' },
    { dir: path.join(process.cwd(), 'public', 'uploads'), prefix: 'uploads' },
  ];

  for (const { dir, prefix } of localDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      result.totalProcessed++;
      const r2Key = `media/${prefix}/${file}`;
      const mimeType = getMimeType(file);

      try {
        const buffer = fs.readFileSync(fullPath);
        const r2Url = await uploadBufferToR2(r2Key, buffer, mimeType, config);

        // Also record in media table
        const fileId = `local-${prefix}-${file.replace(/[^a-z0-9_-]+/gi, '-')}`;
        const existing = await db.findOne('media', { id: fileId });
        const mediaRecord: Partial<MediaFile> = {
          id: fileId,
          name: file,
          original_name: file,
          url: r2Url,
          storage_provider: 'cloudflare_r2',
          size_bytes: stat.size,
          mime_type: mimeType,
          remote_key: r2Key,
          synced_to_cloud: true,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await db.update('media', fileId, mediaRecord as any);
        } else {
          await db.insert('media', {
            ...mediaRecord,
            created_at: new Date().toISOString(),
            used_in: [],
          } as any);
        }

        result.uploadedCount++;
      } catch (err: unknown) {
        result.failedCount++;
        const msg = err instanceof Error ? err.message : 'Upload error';
        result.errors.push(`Failed to upload ${file}: ${msg}`);
      }
    }
  }

  return result;
}

/**
 * Synchronize all article and product images to Cloudflare R2
 * Downloads images from Google Cloud Storage / external host, uploads to R2, and updates DB URLs
 */
export async function syncArticleImagesToR2(
  config: R2Config,
  options: { maxPosts?: number; updateDatabase?: boolean } = {}
): Promise<SyncResult> {
  const { maxPosts = 5000, updateDatabase = true } = options;
  const result: SyncResult = {
    success: true,
    totalProcessed: 0,
    uploadedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
    publicDomain: config.publicDomain,
  };

  const postsRes = await db.find('posts', { limit: maxPosts });
  const posts = postsRes.rows;

  for (const post of posts) {
    let postChanged = false;

    // 1. Hero Image
    if (post.hero_image && post.hero_image.startsWith('http') && !post.hero_image.includes(config.publicDomain)) {
      result.totalProcessed++;
      try {
        const filename = path.basename(new URL(post.hero_image).pathname);
        const r2Key = `media/posts/hero-${post.slug}-${filename}`;
        
        const imgRes = await fetch(post.hero_image);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mime = imgRes.headers.get('content-type') || getMimeType(filename);
          const newUrl = await uploadBufferToR2(r2Key, buffer, mime, config);

          post.hero_image = newUrl;
          postChanged = true;
          result.uploadedCount++;
        } else {
          result.failedCount++;
          result.errors.push(`Hero image 404 for ${post.slug}`);
        }
      } catch (err: unknown) {
        result.failedCount++;
        const msg = err instanceof Error ? err.message : 'Error';
        result.errors.push(`Hero upload failed for ${post.slug}: ${msg}`);
      }
    }

    // 2. Items Images
    if (post.items && Array.isArray(post.items)) {
      for (const item of post.items) {
        if (item.image && item.image.startsWith('http') && !item.image.includes(config.publicDomain)) {
          result.totalProcessed++;
          try {
            const filename = path.basename(new URL(item.image).pathname);
            const cleanHeading = (item.heading || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
            const r2Key = `media/items/${cleanHeading}-${filename}`;

            const imgRes = await fetch(item.image);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const mime = imgRes.headers.get('content-type') || getMimeType(filename);
              const newUrl = await uploadBufferToR2(r2Key, buffer, mime, config);

              item.image = newUrl;
              postChanged = true;
              result.uploadedCount++;
            } else {
              result.skippedCount++;
            }
          } catch {
            result.failedCount++;
          }
        }
      }
    }

    if (postChanged && updateDatabase) {
      await db.update('posts', post.id, {
        hero_image: post.hero_image,
        items: post.items,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Update storage settings timestamp
  await updateStorageSettings({
    provider: 'cloudflare_r2',
    last_synced_at: new Date().toISOString(),
  });

  return result;
}
