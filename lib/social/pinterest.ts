import { db } from '@/lib/db';
import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';

interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
}

interface PinterestPinResult {
  id: string;
  title: string;
  link: string;
  board_id: string;
  created_at: string;
}

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

type PinterestOAuthSettings = {
  pinterest_access_token?: string;
  pinterest_refresh_token?: string;
  pinterest_token_expires_at?: number;
  pinterest_client_id?: string;
  pinterest_client_secret?: string;
};

function formatPinterestApiError(status: number, responseBody: unknown, fallback: string): string {
  const raw = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody || {});
  let data: any = responseBody;
  if (typeof responseBody === 'string') {
    try { data = JSON.parse(responseBody); } catch { data = {}; }
  }
  const missing = raw.match(/Missing:\s*\[([^\]]+)\]/i)?.[1];
  if (/insufficient permissions|missing.*(?:boards:write|pins:write)/i.test(raw) || missing) {
    const scopes = missing || 'boards:write và pins:write';
    return `Pinterest từ chối thao tác vì Access Token thiếu quyền ${scopes}. Hãy bấm “Kết nối lại Pinterest” để cấp boards:read, boards:write, pins:read và pins:write; token cũ không thể tự thêm quyền.`;
  }
  const message = data?.message || data?.detail || data?.error || raw || fallback;
  return `Pinterest API (HTTP ${status}): ${String(message)}`;
}

async function requestPinterestBoards(token: string, pageSize = 100): Promise<PinterestBoard[]> {
  const res = await fetch(`${PINTEREST_API_BASE}/boards?page_size=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(formatPinterestApiError(res.status, data, 'Không thể đọc danh sách Pinterest boards'));
  return data.items || [];
}

async function refreshPinterestOAuthToken(settings: PinterestOAuthSettings): Promise<string> {
  const clientId = settings.pinterest_client_id?.trim();
  const clientSecret = settings.pinterest_client_secret;
  const refreshToken = settings.pinterest_refresh_token;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Pinterest Access Token đã hết hạn. Hãy kết nối lại Pinterest trong mục Social Auto-Share.');
  }

  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
  const response = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(formatPinterestApiError(response.status, data, 'Không thể làm mới Pinterest Access Token'));
  }

  const latest = await db.getSetting<PinterestOAuthSettings & Record<string, any>>('social_settings') || {};
  await db.setSetting('social_settings', {
    ...latest,
    pinterest_access_token: data.access_token,
    pinterest_refresh_token: data.refresh_token || refreshToken,
    pinterest_token_expires_at: Date.now() + Number(data.expires_in || 2_592_000) * 1000,
  });
  return data.access_token as string;
}

/** Returns a current token, refreshing Pinterest OAuth tokens shortly before expiration. */
export async function getValidPinterestAccessToken(token?: string): Promise<string | null> {
  const settings = await db.getSetting<PinterestOAuthSettings>('social_settings') || {};
  const storedToken = settings.pinterest_access_token?.trim();
  const candidate = token?.trim() || storedToken;
  if (!candidate) return null;

  const expiresAt = Number(settings.pinterest_token_expires_at || 0);
  if (storedToken && candidate === storedToken && expiresAt && expiresAt <= Date.now() + 60_000) {
    return refreshPinterestOAuthToken(settings);
  }
  return candidate;
}

/**
 * Get the active Pinterest token from social settings, environment or legacy site settings.
 */
export async function getPinterestToken(): Promise<string | null> {
  try {
    const socialSettings = await db.getSetting<PinterestOAuthSettings>('social_settings');
    if (socialSettings?.pinterest_access_token) {
      return await getValidPinterestAccessToken(socialSettings.pinterest_access_token);
    }
  } catch {}
  if (process.env.PINTEREST_ACCESS_TOKEN) {
    return process.env.PINTEREST_ACCESS_TOKEN.trim();
  }
  try {
    const siteSettings = await db.getSetting<any>('site');
    if (siteSettings?.pinterest_access_token) {
      return siteSettings.pinterest_access_token.trim();
    }
  } catch {}
  return null;
}

/**
 * Fetch all boards for the authenticated Pinterest user
 */
export async function listPinterestBoards(token: string): Promise<PinterestBoard[]> {
  try {
    return await requestPinterestBoards(token);
  } catch (err) {
    console.error('[Pinterest] Exception listing boards:', err);
    return [];
  }
}

export async function testPinterestConnection(token: string): Promise<{
  success: boolean;
  boards_count?: number;
  sample_boards?: string[];
  error?: string;
}> {
  try {
    const boards = await requestPinterestBoards(token, 100);
    return {
      success: true,
      boards_count: boards.length,
      sample_boards: boards.slice(0, 5).map((board) => board.name),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể kiểm tra Pinterest Access Token' };
  }
}

/**
 * Find existing board by name or create a new board on Pinterest
 */
export async function getOrCreatePinterestBoard(
  token: string,
  boardName: string,
  description?: string
): Promise<string | null> {
  const cleanName = boardName.trim().slice(0, 50);
  const existingBoards = await requestPinterestBoards(token);
  const found = existingBoards.find(
    (b) => b.name.toLowerCase().trim() === cleanName.toLowerCase().trim()
  );

  if (found) {
    return found.id;
  }

  // Create new board
  try {
    const res = await fetch(`${PINTEREST_API_BASE}/boards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        description: description || `Colección de las mejores ideas de regalos seleccionadas por Miregalo.us.`,
        privacy: 'PUBLIC',
      }),
    });

    if (!res.ok) {
      const errText = await res.json().catch(() => ({}));
      console.warn(`[Pinterest] Error creating board "${cleanName}":`, errText);
      throw new Error(formatPinterestApiError(res.status, errText, `Không thể tạo Pinterest board "${cleanName}"`));
    }

    const created = await res.json();
    console.log(`[Pinterest] Created new board "${cleanName}" with ID ${created.id}`);
    return created.id;
  } catch (err) {
    console.error(`[Pinterest] Exception creating board "${cleanName}":`, err);
    throw err;
  }
}

/**
 * Publish a single Pin to Pinterest
 */
export async function publishPostToPinterest(
  token: string,
  post: Post,
  boardName: string
): Promise<PinterestPinResult | null> {
  const boardId = await getOrCreatePinterestBoard(
    token,
    boardName,
    `Las mejores recomendaciones y guías de compra para ${boardName} en Miregalo.us.`
  );

  if (!boardId) {
    throw new Error(`Could not find or create Pinterest board for "${boardName}"`);
  }

  const postUrl = `${SITE_URL}${postPath(post)}`;
  const title = (post.title || 'Guía de Regalos').slice(0, 100);
  const description = (
    post.seo_description ||
    post.excerpt ||
    'Descubre las mejores recomendaciones y ofertas seleccionadas por Miregalo.us.'
  ).slice(0, 500);

  const heroImage = post.hero_image?.startsWith('http')
    ? post.hero_image
    : `${SITE_URL}${post.hero_image?.startsWith('/') ? '' : '/'}${post.hero_image || 'images/miregalo-logo.png'}`;

  const payload = {
    board_id: boardId,
    title,
    description,
    link: postUrl,
    media_source: {
      source_type: 'image_url',
      url: heroImage,
    },
  };

  const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(formatPinterestApiError(res.status, errBody, 'Không thể tạo Pin trên Pinterest'));
  }

  const result = await res.json();
  console.log(`[Pinterest] Successfully pinned post "${post.title}" to board "${boardName}" (Pin ID: ${result.id})`);
  return result;
}

/**
 * Worker: Find the oldest unpinned article and pin it to its corresponding URL Map board
 */
export async function pinNextOldestPost(): Promise<{
  success: boolean;
  message: string;
  post_id?: string;
  pin_id?: string;
  board?: string;
}> {
  const token = await getPinterestToken();
  if (!token) {
    return {
      success: false,
      message: 'Pinterest Access Token not configured (PINTEREST_ACCESS_TOKEN)',
    };
  }

  // 1. Load catalog URLs to map clusters/categories to board names
  const [postsRes, catalogUrlsRes, categoriesRes] = await Promise.all([
    db.find('posts', { limit: 2000, order: [{ field: 'published_at', asc: true }] }),
    db.find('catalog_urls', { limit: 200 }),
    db.find('categories', { limit: 100 }),
  ]);

  const catMap = new Map(categoriesRes.rows.map((c: any) => [c.id, c.name]));
  const catalogMap = new Map(catalogUrlsRes.rows.map((u: any) => [u.id, u.page_title]));

  // 2. Filter published posts that have not yet been pinned to Pinterest
  const unpinnedPosts = postsRes.rows.filter((p: any) => {
    if (p.status !== 'published') return false;
    // Skip if already pinned
    if (p.pinterest_pinned || p.metadata?.pinterest_pinned) return false;
    return true;
  });

  if (unpinnedPosts.length === 0) {
    return {
      success: true,
      message: 'All published posts have already been pinned to Pinterest.',
    };
  }

  // 3. Pick the oldest unpinned post (FIFO)
  const targetPost = unpinnedPosts[0];

  // 4. Resolve the best matching Board name according to URL MAP / Taxonomy
  let boardName = 'Ideas de Regalos';

  if (targetPost.primary_category_id && catMap.has(targetPost.primary_category_id)) {
    boardName = `Regalos ${catMap.get(targetPost.primary_category_id)}`;
  } else if (targetPost.category_ids?.length && catMap.has(targetPost.category_ids[0])) {
    boardName = `Regalos ${catMap.get(targetPost.category_ids[0])}`;
  } else if ((targetPost as any).cluster) {
    boardName = `Regalos para ${(targetPost as any).cluster}`;
  }

  // Clean board name: remove duplicate words like "Regalos Regalos..."
  boardName = boardName.replace(/^Regalos\s+para\s+Regalos/i, 'Regalos para');
  boardName = boardName.replace(/^Regalos\s+Regalos/i, 'Regalos');
  if (!boardName.toLowerCase().startsWith('regalos')) {
    boardName = `Regalos: ${boardName}`;
  }

  // 5. Publish Pin via Pinterest API
  try {
    const pinRes = await publishPostToPinterest(token, targetPost, boardName);

    // 6. Mark post as pinned so it is never repeated
    await db.update('posts', targetPost.id, {
      pinterest_pinned: true,
      pinterest_pin_id: pinRes?.id,
      pinterest_board: boardName,
      pinterest_pinned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully pinned "${targetPost.title}" to board "${boardName}"`,
      post_id: targetPost.id,
      pin_id: pinRes?.id,
      board: boardName,
    };
  } catch (err: any) {
    console.error(`[Pinterest] Error pinning post ${targetPost.id}:`, err);
    return {
      success: false,
      message: err.message || String(err),
      post_id: targetPost.id,
      board: boardName,
    };
  }
}
