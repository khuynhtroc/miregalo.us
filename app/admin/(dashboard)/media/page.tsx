import { getMediaFiles, getStorageSettings, DEFAULT_STORAGE_SETTINGS } from '@/lib/storage/service';
import { MediaManager } from './MediaManager';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  try {
    const [mediaData, storageSettings] = await Promise.all([
      getMediaFiles({ limit: 100 }),
      getStorageSettings(),
    ]);

    return (
      <MediaManager
        initialFiles={mediaData?.files || []}
        initialSettings={storageSettings || DEFAULT_STORAGE_SETTINGS}
        stats={mediaData?.stats || { totalFiles: 0, totalSizeBytes: 0, cloudSyncedCount: 0, localOnlyCount: 0 }}
      />
    );
  } catch (err: unknown) {
    console.error('Failed to load media files in AdminMediaPage:', err);
    return (
      <MediaManager
        initialFiles={[]}
        initialSettings={DEFAULT_STORAGE_SETTINGS}
        stats={{ totalFiles: 0, totalSizeBytes: 0, cloudSyncedCount: 0, localOnlyCount: 0 }}
      />
    );
  }
}
