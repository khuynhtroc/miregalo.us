import fs from 'fs';
import { createSign } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

async function getAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const normalizedKey = privateKey.replace(/\\n/g, '\n');

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: INDEXING_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signatureInput);
  signer.end();
  const signature = signer.sign(normalizedKey, 'base64url');
  const assertion = `${signatureInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

async function main() {
  const { data: settingRow } = await sb.from('settings').select('*').eq('key', 'google_indexing_settings').single();
  const settings = settingRow?.value;

  if (!settings?.client_email || !settings?.private_key) {
    console.error('Missing Google Indexing credentials');
    return;
  }

  const token = await getAccessToken(settings.client_email, settings.private_key);
  console.log('✅ Google OAuth Access Token obtained successfully!');

  const topPages = JSON.parse(fs.readFileSync('scripts/gsc-summary.json', 'utf8')).pagesWithClicks;
  const urlsToPush = topPages.slice(0, 20).map(p => p.url);

  console.log(`Pushing ${urlsToPush.length} top click pages to Google Indexing API...`);

  let count = 0;
  for (const url of urlsToPush) {
    try {
      const res = await fetch(INDEXING_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
      });
      const data = await res.json();
      if (res.ok) {
        count++;
        console.log(`[${count}/${urlsToPush.length}] Success 200: ${url}`);
      } else {
        console.warn(`[HTTP ${res.status}] ${url}:`, data?.error?.message || data);
      }
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      console.warn(`Error on ${url}:`, e.message);
    }
  }

  console.log(`\n🎉 Successfully pushed ${count} optimized top pages to Google Indexing!`);
}

main().catch(console.error);
