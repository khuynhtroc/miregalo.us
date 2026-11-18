import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.join(__dirname, '..', '.open-next', 'worker.js');

if (!fs.existsSync(workerPath)) {
  console.error('.open-next/worker.js not found!');
  process.exit(1);
}

let content = fs.readFileSync(workerPath, 'utf-8');

const patchedExport = `export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil((async () => {
            try {
                const baseUrl = env.NEXT_PUBLIC_SITE_URL || "https://www.miregalo.us";
                const headers = env.CRON_SECRET ? { "Authorization": \`Bearer \${env.CRON_SECRET}\` } : {};
                await fetch(\`\${baseUrl}/api/cron/social-backfill/\`, { method: "GET", headers });
                await fetch(\`\${baseUrl}/api/cron/publish/\`, { method: "GET", headers });
            } catch (err) {
                console.error("[Worker Scheduled Error]:", err);
            }
        })());
    },
    async fetch(request, env, ctx) {
        const reqUrl = new URL(request.url);
        const isPublicCacheable =
            request.method === "GET" &&
            reqUrl.hostname === "www.miregalo.us" &&
            reqUrl.protocol === "https:" &&
            !reqUrl.pathname.startsWith("/admin") &&
            !reqUrl.pathname.startsWith("/api/") &&
            !reqUrl.pathname.startsWith("/go/") &&
            !reqUrl.pathname.startsWith("/_next/") &&
            !reqUrl.pathname.startsWith("/cdn-cgi/");

        let edgeCache = null;
        let cacheKeyReq = null;
        if (isPublicCacheable && typeof caches !== "undefined" && caches.default) {
            edgeCache = caches.default;
            const keyUrl = new URL(reqUrl.toString());
            if (request.headers.get("RSC") === "1") {
                keyUrl.searchParams.set("__rsc", "1");
            }
            cacheKeyReq = new Request(keyUrl.toString(), { method: "GET" });
            const cachedResp = await edgeCache.match(cacheKeyReq);
            if (cachedResp) {
                return cachedResp;
            }
        }

        const resp = await runWithCloudflareRequestContext(request, env, ctx, async () => {
            const response = maybeGetSkewProtectionResponse(request);
            if (response) {
                return response;
            }
            const url = new URL(request.url);
            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            if (url.pathname ===
                \`\${globalThis.__NEXT_BASE_PATH__}/_next/image\${globalThis.__TRAILING_SLASH__ ? "/" : ""}\`) {
                return await handleImageRequest(url, request.headers, env);
            }
            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);
        });

        if (edgeCache && cacheKeyReq && resp && resp.status === 200) {
            const cloned = resp.clone();
            const headers = new Headers(cloned.headers);
            const ttl = reqUrl.pathname === "/" ? 300 : 1800;
            headers.set("Cache-Control", \`public, max-age=120, s-maxage=\${ttl}, stale-while-revalidate=86400\`);
            headers.delete("Set-Cookie");
            const cacheableResp = new Response(cloned.body, {
                status: 200,
                headers,
            });
            ctx.waitUntil(edgeCache.put(cacheKeyReq, cacheableResp));
        }

        return resp;
    },
};`;

const startIdx = content.indexOf('export default {');
if (startIdx !== -1) {
  content = content.slice(0, startIdx) + patchedExport + '\n';
  fs.writeFileSync(workerPath, content, 'utf-8');
  console.log('✅ Successfully patched .open-next/worker.js with Cloudflare Edge Cache + Scheduled Cron Handler!');
} else {
  console.error('❌ Could not find export default in .open-next/worker.js');
  process.exit(1);
}
