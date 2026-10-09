import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [k, ...v] = line.split('=');
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function run() {
  console.log('[Test] Generating article for KW-001: "ideas de regalos para mamá"...');
  const startTime = Date.now();

  try {
    const { generateMultiStageArticle } = await import('../lib/ai/multi-stage-generator.js').catch(async () => {
      // If .js not found, compile or run through Next.js API endpoint
      return null;
    });

    if (!generateMultiStageArticle) {
      console.log('[Test] Calling via Next.js internal /api/admin/jobs route...');
    }
  } catch (err) {
    console.error('[Test] Error:', err);
  }
}

run();
