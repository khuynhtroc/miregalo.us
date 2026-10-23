import { db } from '@/lib/db';
import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
}

export interface PinterestPinResult {
  id: string;
  title: string;
  link: string;
  board_id: string;
  created_at: string;
}

export interface PinterestSyncState {
  pinned_post_ids: string[];
  history: Array<{
    post_id: string;
    slug: string;
    pin_id: string;
    board: string;
    pinned_at: string;
  }>;
  last_sync_at?: string;
  total_synced?: number;
}

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
const DEFAULT_BOARD = 'Ideas de Regalos';
const SYNC_STATE_KEY = 'pinterest_sync_state';

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
    if (socialSettings?.pinterest_access_token?.trim()) {
      return await getValidPinterestAccessToken(socialSettings.pinterest_access_token);
    }
  } catch {}

  if (process.env.PINTEREST_ACCESS_TOKEN?.trim()) {
    return process.env.PINTEREST_ACCESS_TOKEN.trim();
  }

  try {
    const siteSettings = await db.getSetting<any>('site');
    if (siteSettings?.pinterest_access_token?.trim()) {
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

/**
 * Test Pinterest API Connection via /user_account and list boards
 */
export async function testPinterestConnection(token: string): Promise<{
  success: boolean;
  username?: string;
  account_type?: string;
  profile_image?: string;
  boards_count?: number;
  sample_boards?: string[];
  error?: string;
}> {
  if (!token?.trim()) {
    return { success: false, boards_count: 0, sample_boards: [], error: 'Token không được để trống' };
  }

  try {
    const validToken = (await getValidPinterestAccessToken(token)) || token.trim();
    const [boards, userRes] = await Promise.all([
      requestPinterestBoards(validToken, 100),
      fetch(`${PINTEREST_API_BASE}/user_account`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }).catch(() => null),
    ]);

    let username: string | undefined;
    let accountType: string | undefined;
    let profileImage: string | undefined;

    if (userRes && userRes.ok) {
      const userData = await userRes.json().catch(() => ({}));
      username = userData.username || userData.business_name;
      accountType = userData.account_type;
      profileImage = userData.profile_image;
    }

    return {
      success: true,
      username,
      account_type: accountType,
      profile_image: profileImage,
      boards_count: boards.length,
      sample_boards: boards.slice(0, 5).map((board) => board.name),
    };
  } catch (err: any) {
    return {
      success: false,
      boards_count: 0,
      sample_boards: [],
      error: err?.message || 'Không thể kiểm tra Pinterest Access Token',
    };
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
        Authorization: `Bearer ${token.trim()}`,
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
      if (existingBoards[0]?.id) {
        return existingBoards[0].id;
      }
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
 * Smart board resolver based on post taxonomy, type and focus keywords
 */
export function resolveBoardForPost(post: Partial<Post>, fallbackBoard = DEFAULT_BOARD): string {
  const title = (post.title || '').toLowerCase();
  const slug = (post.slug || '').toLowerCase();
  const focus = (post.focus_keyword || '').toLowerCase();

  if (title.includes('halloween') || slug.includes('halloween') || focus.includes('halloween')) {
    return 'Regalos Halloween 2026';
  }

  if (post.type === 'blog') {
    if (title.includes('tendencia') || title.includes('noticia') || title.includes('2026')) {
      return 'Tendencias y Novedades de Regalos';
    }
    return 'Blog e Inspiración Miregalo';
  }

  if (title.includes('novio') || title.includes('pareja') || title.includes('aniversario') || title.includes('esposo')) {
    return 'Regalos para Parejas y Novios';
  }
  if (title.includes('mama') || title.includes('madre') || title.includes('mujer') || title.includes('chica')) {
    return 'Regalos para Mujeres y Mamá';
  }
  if (title.includes('papa') || title.includes('padre') || title.includes('hombre')) {
    return 'Regalos para Hombres y Papá';
  }
  if (title.includes('navidad') || title.includes('reyes')) {
    return 'Regalos de Navidad';
  }
  if (title.includes('cumpleaños')) {
    return 'Regalos de Cumpleaños';
  }

  return fallbackBoard;
}

/**
 * Publish a single Pin to Pinterest
 */
export async function publishPostToPinterest(
  token: string,
  post: Post,
  boardName?: string
): Promise<PinterestPinResult | null> {
  const targetBoardName = boardName || resolveBoardForPost(post);
  const boardId = await getOrCreatePinterestBoard(
    token,
    targetBoardName,
    `Las mejores recomendaciones y guías de compra para ${targetBoardName} en Miregalo.us.`
  );

  if (!boardId) {
    throw new Error(`Could not find or create Pinterest board for "${targetBoardName}"`);
  }

  const postUrl = `${SITE_URL}${postPath(post)}`;
  const title = (post.title || 'Guía de Regalos').slice(0, 100);

  // Format description with hashtags (max 500 chars)
  const baseDesc = post.seo_description || post.excerpt || 'Descubre las mejores recomendaciones e ideas de regalos seleccionadas por Miregalo.us.';
  const hashtags = '\n\n#regalos #ideaspararegalar #miregalo #guíaderegalos';
  const maxDescLen = 500 - hashtags.length;
  const description = `${baseDesc.slice(0, maxDescLen).trim()}${hashtags}`;

  // Ensure absolute HTTPS Hero Image URL
  let heroImage = post.hero_image?.trim() || '';
  if (!heroImage) {
    heroImage = `${SITE_URL}/images/miregalo-logo-fullsize.png`;
  } else if (!heroImage.startsWith('http://') && !heroImage.startsWith('https://')) {
    heroImage = `${SITE_URL}${heroImage.startsWith('/') ? '' : '/'}${heroImage}`;
  }

  const payload: Record<string, any> = {
    board_id: boardId,
    title,
    description,
    link: postUrl,
    alt_text: (post.hero_alt || post.title || 'Miregalo').slice(0, 500),
    media_source: {
      source_type: 'image_url',
      url: heroImage,
    },
  };

  const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(formatPinterestApiError(res.status, errBody, 'Không thể tạo Pin trên Pinterest'));
  }

  const result: PinterestPinResult = await res.json();
  console.log(`[Pinterest] Successfully pinned post "${post.title}" to board "${targetBoardName}" (Pin ID: ${result.id})`);

  // Record into persistent sync state
  await recordPinnedPost(post.id, post.slug, result.id, targetBoardName);

  return result;
}

/**
 * Retrieve persistent Pinterest sync state from DB settings
 */
export async function getPinterestSyncState(): Promise<PinterestSyncState> {
  try {
    const state = await db.getSetting<PinterestSyncState>(SYNC_STATE_KEY);
    if (state && Array.isArray(state.pinned_post_ids)) {
      return state;
    }
  } catch {}

  return {
    pinned_post_ids: [],
    history: [],
    total_synced: 0,
  };
}

/**
 * Record a newly pinned post in persistent settings
 */
export async function recordPinnedPost(
  postId: string,
  slug: string,
  pinId: string,
  board: string
): Promise<void> {
  try {
    const current = await getPinterestSyncState();
    if (!current.pinned_post_ids.includes(postId)) {
      current.pinned_post_ids.push(postId);
      current.history.unshift({
        post_id: postId,
        slug,
        pin_id: pinId,
        board,
        pinned_at: new Date().toISOString(),
      });
      if (current.history.length > 500) {
        current.history = current.history.slice(0, 500);
      }
      current.last_sync_at = new Date().toISOString();
      current.total_synced = current.pinned_post_ids.length;
      await db.setSetting(SYNC_STATE_KEY, current);
    }
  } catch (err) {
    console.warn('[Pinterest] Failed to update sync state in DB:', err);
  }
}

/**
 * Batch Worker: Pin up to `limit` unpinned published posts to Pinterest
 */
export async function syncUnpinnedPostsToPinterest(limit = 5): Promise<{
  success: boolean;
  message: string;
  total_published: number;
  total_pinned: number;
  remaining: number;
  pinned_this_run: number;
  details: Array<{
    post_id: string;
    slug: string;
    title: string;
    board: string;
    pin_id?: string;
    error?: string;
  }>;
}> {
  const token = await getPinterestToken();
  if (!token) {
    return {
      success: false,
      message: 'Pinterest Access Token chưa được cấu hình (PINTEREST_ACCESS_TOKEN)',
      total_published: 0,
      total_pinned: 0,
      remaining: 0,
      pinned_this_run: 0,
      details: [],
    };
  }

  const [{ rows: allPosts }, syncState] = await Promise.all([
    db.find('posts', {
      eq: { status: 'published' },
      order: [{ field: 'published_at', asc: true }],
      limit: 1000,
    }),
    getPinterestSyncState(),
  ]);

  const pinnedSet = new Set(syncState.pinned_post_ids);
  const unpinned = allPosts.filter((p: any) => !pinnedSet.has(p.id));

  if (unpinned.length === 0) {
    return {
      success: true,
      message: 'Tất cả bài viết đã xuất bản đều đã được ghim lên Pinterest!',
      total_published: allPosts.length,
      total_pinned: pinnedSet.size,
      remaining: 0,
      pinned_this_run: 0,
      details: [],
    };
  }

  const batch = unpinned.slice(0, Math.max(1, Math.min(limit, 20)));
  const details: any[] = [];
  let successCount = 0;

  for (const post of batch) {
    const targetBoard = resolveBoardForPost(post);
    try {
      const pinResult = await publishPostToPinterest(token, post as Post, targetBoard);
      details.push({
        post_id: post.id,
        slug: post.slug,
        title: post.title,
        board: targetBoard,
        pin_id: pinResult?.id,
      });
      successCount++;
    } catch (err: any) {
      details.push({
        post_id: post.id,
        slug: post.slug,
        title: post.title,
        board: targetBoard,
        error: err?.message || String(err),
      });
    }

    if (batch.length > 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  const updatedState = await getPinterestSyncState();

  return {
    success: successCount > 0,
    message: `Đã đồng bộ thành công ${successCount}/${batch.length} bài viết lên Pinterest.`,
    total_published: allPosts.length,
    total_pinned: updatedState.pinned_post_ids.length,
    remaining: Math.max(0, allPosts.length - updatedState.pinned_post_ids.length),
    pinned_this_run: successCount,
    details,
  };
}

/**
 * Worker: Pin next oldest post (legacy backwards compatibility)
 */
export async function pinNextOldestPost() {
  const result = await syncUnpinnedPostsToPinterest(1);
  const first = result.details[0];
  return {
    success: result.pinned_this_run > 0,
    message: result.message,
    post_id: first?.post_id,
    pin_id: first?.pin_id,
    board: first?.board,
  };
}
