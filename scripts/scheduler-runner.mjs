import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [k, ...v] = line.split('=');
      env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://www.miregalo.us';
const cronEndpoint = `${siteUrl}/api/cron/publish`;

console.log(`[Scheduler Runner] Running scheduled article check at: ${new Date().toISOString()}`);
console.log(`[Scheduler Runner] Calling endpoint: ${cronEndpoint}`);

async function run() {
  try {
    const res = await fetch(cronEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'Miregalo-Scheduler-Runner/1.0',
      },
    });

    const data = await res.json();
    console.log('[Scheduler Runner] Response status:', res.status);
    console.log('[Scheduler Runner] Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Scheduler Runner] Execution failed:', err);
  }
}

run();
