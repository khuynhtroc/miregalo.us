import 'server-only';
import { createSign } from 'crypto';
import { db } from '@/lib/db';

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function resolveGscCredentials(): Promise<{ clientEmail: string; privateKey: string } | null> {
  let clientEmail = process.env.GSC_CLIENT_EMAIL?.trim() || '';
  let privateKey = process.env.GSC_PRIVATE_KEY?.trim() || '';

  if (!clientEmail || !privateKey) {
    try {
      const saved = await db.getSetting<{ client_email?: string; private_key?: string }>('google_indexing_settings');
      clientEmail = clientEmail || saved?.client_email?.trim() || '';
      privateKey = privateKey || saved?.private_key?.trim() || '';
    } catch {
      // ignore db read errors
    }
  }

  if (!clientEmail || !privateKey) return null;
  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

export function isGscConfigured(): boolean {
  return Boolean(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY);
}

/**
 * Returns a valid OAuth2 / Service Account access token for Google Search Console API.
 */
export async function getGscAccessToken(): Promise<string | null> {
  const creds = await resolveGscCredentials();
  if (!creds) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const { clientEmail, privateKey } = creds;

  // Build JWT header and payload
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: GSC_SCOPE,
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
  const signature = signer.sign(privateKey, 'base64url');
  const assertion = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to obtain Google Search Console access token: ${errText}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };

  return cachedToken.token;
}
