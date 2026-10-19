import 'server-only';
import { createSign } from 'crypto';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/urls';

const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

export interface GoogleIndexingSettings {
  enabled: boolean;
  auto_submit_on_publish: boolean;
  client_email?: string;
  private_key?: string;
  ping_sitemap?: boolean;
  ping_indexnow?: boolean;
  indexnow_key?: string;
}

export interface IndexingLogItem {
  id: string;
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
  engine: 'google_indexing_api' | 'sitemap_ping' | 'indexnow';
  status: 'success' | 'error' | 'simulated';
  statusCode?: number;
  message?: string;
  timestamp: string;
}

const DEFAULT_INDEXING_SETTINGS: GoogleIndexingSettings = {
  enabled: true,
  auto_submit_on_publish: true,
  ping_sitemap: true,
  ping_indexnow: false,
};

/**
 * Retrieves the indexing configuration from database or env.
 */
export async function getIndexingSettings(): Promise<GoogleIndexingSettings> {
  try {
    const saved = await db.getSetting<GoogleIndexingSettings>('google_indexing_settings');
    const clientEmail =
      saved?.client_email?.trim() ||
      process.env.GOOGLE_INDEXING_CLIENT_EMAIL?.trim() ||
      process.env.GSC_CLIENT_EMAIL?.trim() ||
      '';

    const privateKey =
      saved?.private_key?.trim() ||
      process.env.GOOGLE_INDEXING_PRIVATE_KEY?.trim() ||
      process.env.GSC_PRIVATE_KEY?.trim() ||
      '';

    return {
      ...DEFAULT_INDEXING_SETTINGS,
      ...saved,
      client_email: clientEmail,
      private_key: privateKey,
    };
  } catch {
    return DEFAULT_INDEXING_SETTINGS;
  }
}

/**
 * Saves updated indexing configuration into database settings.
 */
export async function saveIndexingSettings(patch: Partial<GoogleIndexingSettings>): Promise<GoogleIndexingSettings> {
  const current = await getIndexingSettings();
  const updated: GoogleIndexingSettings = {
    ...current,
    ...patch,
  };
  await db.setSetting('google_indexing_settings', updated);
  return updated;
}

/**
 * Obtains an OAuth2 Access Token for Google Indexing API using Service Account RSA-SHA256 JWT.
 */
export async function getIndexingAccessToken(clientEmail: string, privateKey: string): Promise<string> {
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

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth Token Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('No access_token returned by Google OAuth');
  }

  return data.access_token as string;
}

/**
 * Retrieves the list of recent indexing submission logs.
 */
export async function getIndexingLogs(): Promise<IndexingLogItem[]> {
  try {
    const logs = await db.getSetting<IndexingLogItem[]>('indexing_history_logs');
    return Array.isArray(logs) ? logs : [];
  } catch {
    return [];
  }
}

/**
 * Appends a log entry to the indexing history in database.
 */
async function appendIndexingLog(item: Omit<IndexingLogItem, 'id' | 'timestamp'>) {
  try {
    const current = await getIndexingLogs();
    const newEntry: IndexingLogItem = {
      ...item,
      id: `idx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    // Keep last 150 log entries to maintain fast responses
    const trimmed = [newEntry, ...current].slice(0, 150);
    await db.setSetting('indexing_history_logs', trimmed);
  } catch (err) {
    console.warn('[Indexing Log] Failed to save log entry:', err);
  }
}

/**
 * Submits a single URL to Google Indexing API.
 */
export async function submitUrlToGoogle(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<{ success: boolean; message: string; statusCode?: number }> {
  const config = await getIndexingSettings();

  // If credentials are not configured yet, ping Google Sitemap and log simulated status
  if (!config.client_email || !config.private_key) {
    // Ping Google Sitemap as automatic fallback
    let pingMsg = 'Credentials not configured. Pinged Google Sitemap.';
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`;
      await fetch(pingUrl, { method: 'GET' });
    } catch {}

    await appendIndexingLog({
      url,
      type,
      engine: 'google_indexing_api',
      status: 'simulated',
      message: 'Vui lòng nhập Service Account JSON trong /admin/indexing để kích hoạt Google Indexing API trực tiếp. Đã ping Sitemap tự động.',
    });

    return {
      success: false,
      message: 'Chưa cấu hình Google Service Account. Vui lòng cấu hình trong trang /admin/indexing/',
    };
  }

  try {
    const accessToken = await getIndexingAccessToken(config.client_email, config.private_key);

    const res = await fetch(INDEXING_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (data as any)?.error?.message || `HTTP ${res.status}`;
      await appendIndexingLog({
        url,
        type,
        engine: 'google_indexing_api',
        status: 'error',
        statusCode: res.status,
        message: errMsg,
      });
      return { success: false, statusCode: res.status, message: errMsg };
    }

    const notifyTime = (data as any)?.urlNotificationMetadata?.latestUpdate?.notifyTime || new Date().toISOString();
    const successMsg = `Đã push thành công lên Google Indexing API lúc ${notifyTime}`;

    await appendIndexingLog({
      url,
      type,
      engine: 'google_indexing_api',
      status: 'success',
      statusCode: 200,
      message: successMsg,
    });

    // Also ping sitemap if enabled
    if (config.ping_sitemap) {
      try {
        const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`;
        await fetch(pingUrl, { method: 'GET' });
      } catch {}
    }

    return { success: true, statusCode: 200, message: successMsg };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await appendIndexingLog({
      url,
      type,
      engine: 'google_indexing_api',
      status: 'error',
      message: errMsg,
    });
    return { success: false, message: errMsg };
  }
}

/**
 * Automatically triggers URL indexing when a post is published or updated.
 */
export async function autoSubmitPostIndexing(slug: string, type: 'post' | 'page' = 'post') {
  try {
    const config = await getIndexingSettings();
    if (!config.enabled || !config.auto_submit_on_publish) {
      return;
    }

    const cleanSlug = slug.replace(/^\/|\/$/g, '');
    const fullUrl = `${SITE_URL}/${cleanSlug}/`;

    console.log(`[Auto Indexing] Submitting new ${type} URL to Google: ${fullUrl}`);
    await submitUrlToGoogle(fullUrl, 'URL_UPDATED');
  } catch (err) {
    console.warn('[Auto Indexing] Failed in autoSubmitPostIndexing:', err);
  }
}
