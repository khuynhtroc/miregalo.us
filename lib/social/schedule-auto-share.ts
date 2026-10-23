import { after } from 'next/server';
import type { Post } from '@/lib/types';

/** Run social publishing after the publishing API has returned its response. */
export function schedulePublishedPostAutoShare(post: Post, source: string) {
  after(async () => {
    try {
      const { sharePostToAllChannels } = await import('@/lib/social');
      const report = await sharePostToAllChannels(post);

      if (report.total_attempted > 0 && report.total_success < report.total_attempted) {
        console.warn(`[Social Auto-Share] ${source} had channel failures:`, report.results);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Social Auto-Share] Failed after ${source}:`, message);
    }
  });
}
