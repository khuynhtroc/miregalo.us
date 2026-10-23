import type { Post } from '@/lib/types';

/**
 * Publishes the post across all enabled social channels (Facebook, Pinterest, X, Medium, Webhook).
 * Awaited directly to guarantee completion on Cloudflare Workers / serverless runtimes.
 */
export async function schedulePublishedPostAutoShare(post: Post, source: string): Promise<void> {
  try {
    const { sharePostToAllChannels } = await import('@/lib/social');
    const report = await sharePostToAllChannels(post);

    if (report.total_attempted > 0 && report.total_success < report.total_attempted) {
      console.warn(`[Social Auto-Share] ${source} had channel failures:`, report.results);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Social Auto-Share] Failed during ${source}:`, message);
  }
}
