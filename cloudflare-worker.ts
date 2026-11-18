// OpenNext generates this worker during the Cloudflare build.
// @ts-ignore generated at build time
import nextWorker from './.open-next/worker.js';

type CronEnvironment = Record<string, unknown> & { CRON_SECRET?: string; NEXT_PUBLIC_SITE_URL?: string };
type ScheduledEvent = { cron: string };
type WorkerExecutionContext = { waitUntil(promise: Promise<unknown>): void };

export default {
  async fetch(request: Request, env: CronEnvironment, ctx: WorkerExecutionContext): Promise<Response> {
    const reqUrl = new URL(request.url);
    const isPublicCacheable =
      request.method === 'GET' &&
      reqUrl.hostname === 'www.miregalo.us' &&
      reqUrl.protocol === 'https:' &&
      !reqUrl.pathname.startsWith('/admin') &&
      !reqUrl.pathname.startsWith('/api/') &&
      !reqUrl.pathname.startsWith('/go/') &&
      !reqUrl.pathname.startsWith('/_next/') &&
      !reqUrl.pathname.startsWith('/cdn-cgi/');

    let edgeCache: Cache | null = null;
    let cacheKeyReq: Request | null = null;

    if (isPublicCacheable && typeof caches !== 'undefined' && (caches as unknown as { default?: Cache }).default) {
      edgeCache = (caches as unknown as { default: Cache }).default;
      const keyUrl = new URL(reqUrl.toString());
      if (request.headers.get('RSC') === '1') {
        keyUrl.searchParams.set('__rsc', '1');
      }
      cacheKeyReq = new Request(keyUrl.toString(), { method: 'GET' });
      const cachedResp = await edgeCache.match(cacheKeyReq);
      if (cachedResp) {
        return cachedResp;
      }
    }

    const resp: Response = await nextWorker.fetch(request, env, ctx);

    if (edgeCache && cacheKeyReq && resp && resp.status === 200) {
      const cloned = resp.clone();
      const headers = new Headers(cloned.headers);
      const ttl = reqUrl.pathname === '/' ? 300 : 1800;
      headers.set('Cache-Control', `public, max-age=120, s-maxage=${ttl}, stale-while-revalidate=86400`);
      headers.delete('Set-Cookie');
      const cacheableResp = new Response(cloned.body, {
        status: 200,
        headers,
      });
      ctx.waitUntil(edgeCache.put(cacheKeyReq, cacheableResp));
    }

    return resp;
  },

  async scheduled(_event: ScheduledEvent, env: CronEnvironment, ctx: WorkerExecutionContext) {
    ctx.waitUntil(
      (async () => {
        try {
          const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'https://www.miregalo.us';
          const headers: Record<string, string> = env.CRON_SECRET
            ? { Authorization: `Bearer ${env.CRON_SECRET}` }
            : {};
          await fetch(`${baseUrl}/api/cron/social-backfill/`, { method: 'GET', headers });
          await fetch(`${baseUrl}/api/cron/publish/`, { method: 'GET', headers });
        } catch (err) {
          console.error('[Worker Scheduled Error]:', err);
        }
      })()
    );
  },
};
