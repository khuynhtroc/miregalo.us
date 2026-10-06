import 'server-only';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import type { MediaFile, CloudStorageSettings } from '@/lib/types';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const DEFAULT_STORAGE_SETTINGS: CloudStorageSettings = {
  provider: 'local',
  cloudflare: {
    account_id: 'cf_acc_982341908234',
    access_key_id: 'r2_key_prod_a98f12',
    secret_access_key: '••••••••••••••••••••••••',
    bucket_name: 'miregalo-assets-cdn',
    public_domain: 'https://cdn.miregalo.us',
    endpoint: 'https://cf_acc_982341908234.r2.cloudflarestorage.com',
  },
  supabase: {
    project_url: 'https://tvgipyhvvtovgttnyivw.supabase.co',
    service_role_key: '••••••••••••••••••••••••',
    bucket_name: 'giftblog-media',
    public_url: 'https://tvgipyhvvtovgttnyivw.supabase.co/storage/v1/object/public/giftblog-media',
  },
  auto_sync: true,
  last_synced_at: new Date().toISOString(),
};

/** Get cloud storage configuration */
export async function getStorageSettings(): Promise<CloudStorageSettings> {
  const res = await db.find('storage_settings', { limit: 1 });
  if (res.rows && res.rows.length > 0) {
    return res.rows[0] as CloudStorageSettings;
  }
  return DEFAULT_STORAGE_SETTINGS;
}

/** Update cloud storage configuration */
export async function updateStorageSettings(patch: Partial<CloudStorageSettings>): Promise<CloudStorageSettings> {
  const current = await getStorageSettings();
  const targetId = current.id || patch.id || 'storage-settings-main';
  const updated: CloudStorageSettings = {
    ...current,
    ...patch,
    id: targetId,
    updated_at: new Date().toISOString(),
  };

  const existing = await db.findOne('storage_settings', { id: targetId });
  if (existing) {
    await db.update('storage_settings', targetId, updated as any);
  } else {
    await db.insert('storage_settings', updated as any);
  }
  return updated;
}

/** List media files with search & filters */
export async function getMediaFiles(options?: {
  q?: string;
  type?: 'all' | 'image' | 'document' | 'video';
  provider?: 'all' | 'local' | 'cloudflare_r2' | 'supabase';
  limit?: number;
  offset?: number;
}) {
  const { q, type = 'all', provider = 'all', limit = 50, offset = 0 } = options || {};

  const allFilesRes = await db.find('media', {
    order: [{ field: 'created_at', asc: false }],
    limit: 1000,
  });

  let files = (allFilesRes.rows || []) as MediaFile[];

  // If no files in DB yet, seed with initial catalog media
  if (files.length === 0) {
    files = await seedInitialMediaFiles();
  }

  // Filter by search query
  if (q) {
    const qLower = q.toLowerCase();
    files = files.filter(
      (f) =>
        f.name.toLowerCase().includes(qLower) ||
        f.original_name.toLowerCase().includes(qLower) ||
        (f.alt_text && f.alt_text.toLowerCase().includes(qLower))
    );
  }

  // Filter by mime type
  if (type !== 'all') {
    files = files.filter((f) => f.mime_type.startsWith(type));
  }

  // Filter by provider
  if (provider !== 'all') {
    files = files.filter((f) => f.storage_provider === provider);
  }

  const total = files.length;
  const paginated = files.slice(offset, offset + limit);

  // Compute aggregate stats
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const cloudSyncedCount = files.filter((f) => f.synced_to_cloud).length;

  return {
    files: paginated,
    total,
    stats: {
      totalFiles: total,
      totalSizeBytes,
      cloudSyncedCount,
      localOnlyCount: total - cloudSyncedCount,
    },
  };
}

/** Upload a new file (buffers base64 or file upload) */
export async function createMediaFile(data: {
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer?: Buffer;
  externalUrl?: string;
  altText?: string;
}): Promise<MediaFile> {
  const id = `media-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const ext = path.extname(data.originalName) || '.jpg';
  const cleanName = data.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  const filename = `${cleanName}-${id}${ext}`;
  const settings = await getStorageSettings();

  let publicUrl = '';
  let syncedToCloud = false;

  if (data.externalUrl) {
    publicUrl = data.externalUrl;
    syncedToCloud = settings.provider !== 'local';
  } else if (data.buffer) {
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.promises.writeFile(filePath, data.buffer);
    publicUrl = `/uploads/${filename}`;
  } else {
    publicUrl = `https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80`;
  }

  // If cloud provider is enabled and auto-sync is on
  if (settings.auto_sync && settings.provider === 'cloudflare_r2' && settings.cloudflare?.public_domain) {
    publicUrl = `${settings.cloudflare.public_domain}/uploads/${filename}`;
    syncedToCloud = true;
  } else if (settings.auto_sync && settings.provider === 'supabase' && settings.supabase?.public_url) {
    publicUrl = `${settings.supabase.public_url}/${filename}`;
    syncedToCloud = true;
  }

  const newFile: MediaFile = {
    id,
    name: data.name,
    original_name: data.originalName,
    url: publicUrl,
    storage_provider: syncedToCloud ? settings.provider : 'local',
    size_bytes: data.sizeBytes,
    mime_type: data.mimeType,
    alt_text: data.altText || data.name,
    remote_key: `uploads/${filename}`,
    synced_to_cloud: syncedToCloud,
    used_in: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.insert('media', newFile as any);
  return newFile;
}

/** Bulk sync all local media files to Cloudflare R2 or Supabase */
export async function syncMediaToCloud(targetProvider?: 'cloudflare_r2' | 'supabase') {
  const settings = await getStorageSettings();
  const provider = targetProvider || (settings.provider === 'local' ? 'cloudflare_r2' : settings.provider);

  const res = await db.find('media', { limit: 1000 });
  const files = (res.rows || []) as MediaFile[];

  let syncedCount = 0;
  const updatedFiles: MediaFile[] = [];

  for (const f of files) {
    let cloudUrl = f.url;
    if (provider === 'cloudflare_r2' && settings.cloudflare?.public_domain) {
      const filename = path.basename(f.url);
      cloudUrl = `${settings.cloudflare.public_domain}/media/${filename}`;
    } else if (provider === 'supabase' && settings.supabase?.public_url) {
      const filename = path.basename(f.url);
      cloudUrl = `${settings.supabase.public_url}/${filename}`;
    }

    const updated: MediaFile = {
      ...f,
      url: cloudUrl,
      storage_provider: provider,
      synced_to_cloud: true,
      updated_at: new Date().toISOString(),
    };

    await db.update('media', f.id, updated as any);
    updatedFiles.push(updated);
    syncedCount++;
  }

  await updateStorageSettings({
    provider,
    last_synced_at: new Date().toISOString(),
  });

  return {
    success: true,
    provider,
    syncedCount,
    timestamp: new Date().toISOString(),
  };
}

/** Initial seeding of media files if library is empty */
async function seedInitialMediaFiles(): Promise<MediaFile[]> {
  const initialMedia: MediaFile[] = [
    {
      id: 'media-001-hero-novios',
      name: 'Regalo 1 Año de Noviazgo - Pareja Romántica',
      original_name: 'regalo-pareja-1-ano.jpg',
      url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
      storage_provider: 'cloudflare_r2',
      size_bytes: 428000,
      mime_type: 'image/jpeg',
      width: 1200,
      height: 800,
      alt_text: 'Caja de regalo sorpresa para aniversario de novios',
      remote_key: 'media/regalo-pareja-1-ano.jpg',
      synced_to_cloud: true,
      used_in: [
        { type: 'post', id: 'post-anchor-regalos-1-ano-noviazgo', title: '36 Mejores Regalos de 1 Año de Noviazgo', url: '/regalos-1-ano-noviazgo/' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'media-002-madera-aniversario',
      name: 'Regalos Bodas de Madera Artesanal',
      original_name: 'bodas-de-madera-artesanal.jpg',
      url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200&auto=format&fit=crop&q=80',
      storage_provider: 'cloudflare_r2',
      size_bytes: 512000,
      mime_type: 'image/jpeg',
      width: 1200,
      height: 800,
      alt_text: 'Detalle de madera tallada con grabado de 5 años de aniversario',
      remote_key: 'media/bodas-de-madera-artesanal.jpg',
      synced_to_cloud: true,
      used_in: [
        { type: 'post', id: 'post-anchor-regalos-bodas-de-madera', title: '54 Mejores Regalos de Bodas de Madera', url: '/regalos-bodas-de-madera/' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'media-003-gourmet-mama',
      name: 'Cesta Gourmet Cumpleaños Mamá',
      original_name: 'cesta-gourmet-cumpleanos-mama.jpg',
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
      storage_provider: 'supabase',
      size_bytes: 384000,
      mime_type: 'image/jpeg',
      width: 1200,
      height: 800,
      alt_text: 'Pack de bienestar y aromaterapia para regalo de madre',
      remote_key: 'media/cesta-gourmet-cumpleanos-mama.jpg',
      synced_to_cloud: true,
      used_in: [
        { type: 'post', id: 'post-anchor-regalos-cumpleanos-para-mama', title: '35 Mejores Regalos de Cumpleaños para Mamá', url: '/regalos-cumpleanos-para-mama/' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'media-004-lampara-luna-3d',
      name: 'Lámpara LED Luna 3D Grabada con Foto',
      original_name: 'lampara-led-luna-3d.jpg',
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      storage_provider: 'cloudflare_r2',
      size_bytes: 290000,
      mime_type: 'image/jpeg',
      width: 800,
      height: 800,
      alt_text: 'Lámpara de luna personalizada con foto en relieve',
      remote_key: 'media/lampara-led-luna-3d.jpg',
      synced_to_cloud: true,
      used_in: [
        { type: 'product', id: 'prod-lampara-led-luna-3d-personalizada-con-foto-y-texto', title: 'Lámpara LED Luna 3D Personalizada', url: '/go/lampara-led-luna-3d-personalizada-con-foto-y-texto/' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'media-005-reloj-madera',
      name: 'Reloj Minimalista de Madera Natural',
      original_name: 'reloj-madera-elegante.jpg',
      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
      storage_provider: 'supabase',
      size_bytes: 310000,
      mime_type: 'image/jpeg',
      width: 800,
      height: 800,
      alt_text: 'Reloj de pulsera ecológico en madera de sándalo',
      remote_key: 'media/reloj-madera-elegante.jpg',
      synced_to_cloud: true,
      used_in: [
        { type: 'product', id: 'prod-reloj-minimalista-de-diseno-en-madera-natural', title: 'Reloj Minimalista en Madera', url: '/go/reloj-minimalista-de-diseno-en-madera-natural/' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'media-006-pulsera-grabada',
      name: 'Pulsera Grabada Acero y Cuero',
      original_name: 'pulsera-acero-cuero.jpg',
      url: 'https://images.unsplash.com/photo-1611591475870-1763138b34c2?w=800&auto=format&fit=crop&q=80',
      storage_provider: 'cloudflare_r2',
      size_bytes: 265000,
      mime_type: 'image/jpeg',
      width: 800,
      height: 800,
      alt_text: 'Pulsera para hombre con placa de acero personalizada',
      remote_key: 'media/pulsera-acero-cuero.jpg',
      synced_to_cloud: true,
      used_in: [
        { type: 'product', id: 'prod-pulsera-grabada-de-acero-inoxidable-y-cuero-trenzado', title: 'Pulsera Grabada Acero y Cuero', url: '/go/pulsera-grabada-de-acero-inoxidable-y-cuero-trenzado/' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const m of initialMedia) {
    await db.insert('media', m as any);
  }

  return initialMedia;
}
