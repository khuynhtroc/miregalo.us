// OpenNext generates this worker during the Cloudflare build.
// @ts-ignore generated at build time
import nextWorker from './.open-next/worker.js';

type CronEnvironment = Record<string, unknown> & { CRON_SECRET?: string };
type ScheduledEvent = { cron: string };
type WorkerExecutionContext = { waitUntil(promise: Promise<unknown>): void };

const SITE_ORIGIN = 'https://www.miregalo.us';

export default {
  fetch: nextWorker.fetch,

  async scheduled(event: ScheduledEvent, env: CronEnvironment, ctx: WorkerExecutionContext) {
    if (!env.CRON_SECRET) {
      console.error('[Miregalo Cron] CRON_SECRET is not configured.');
      return;
    }

    const pathname = event.cron === '0 0 * * *'
      ? '/api/cron/publish/'
      : '/api/cron/social-backfill/';
    const request = new Request(`${SITE_ORIGIN}${pathname}`, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });

    ctx.waitUntil(nextWorker.fetch(request, env, ctx));
  },
};
