import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.join(__dirname, '..', '.open-next', 'worker.js');

if (fs.existsSync(workerPath)) {
  let content = fs.readFileSync(workerPath, 'utf-8');
  if (!content.includes('async scheduled(')) {
    const scheduledHandler = `
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
    },`;

    const target = '    async fetch(request, env, ctx) {';
    if (content.includes(target)) {
      content = content.replace(target, `${scheduledHandler}\n${target}`);
      fs.writeFileSync(workerPath, content, 'utf-8');
      console.log('Successfully patched .open-next/worker.js with scheduled cron handler!');
    } else {
      console.warn('Target fetch signature not found in worker.js');
    }
  } else {
    console.log('worker.js already has scheduled cron handler.');
  }
} else {
  console.error('.open-next/worker.js not found!');
}
