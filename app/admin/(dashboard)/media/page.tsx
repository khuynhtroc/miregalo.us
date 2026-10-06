import { getMediaFiles, getStorageSettings } from '@/lib/storage/service';
import { MediaManager } from './MediaManager';

export default async function AdminMediaPage() {
  const [mediaData, storageSettings] = await Promise.all([
    getMediaFiles({ limit: 100 }),
    getStorageSettings(),
  ]);

  return (
    <MediaManager
      initialFiles={mediaData.files}
      initialSettings={storageSettings}
      stats={mediaData.stats}
    />
  );
}
