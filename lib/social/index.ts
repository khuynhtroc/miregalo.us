import { db } from '@/lib/db';
import type { Post } from '@/lib/types';
import type { SocialSettings, ChannelShareResult, MultiShareReport } from './types';
import { shareToFacebook, testFacebookConnection } from './facebook';
import { shareToTwitter, testTwitterConnection } from './twitter';
import { shareToMedium, testMediumConnection } from './medium';
import { getValidPinterestAccessToken, publishPostToPinterest } from './pinterest';
import { triggerSocialWebhook, testSocialWebhook } from './webhook';

export * from './types';
export * from './facebook';
export * from './twitter';
export * from './medium';
export * from './pinterest';
export * from './webhook';

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  auto_share_enabled: false,

  facebook_backfill: {
    status: 'idle',
    queue_id: null,
    post_ids: [],
    cursor: 0,
    interval_minutes: 240,
    start_at: null,
    next_post_at: null,
    started_at: null,
    last_posted_at: null,
    last_post_title: null,
    last_error: null,
    skipped_count: 0,
    lock_id: null,
    lock_until: null,
  },

  facebook_enabled: false,
  facebook_page_id: '',
  facebook_access_token: '',
  facebook_template: '🎁 {title}\n\n{excerpt}\n\n👉 Descubre todas las ideas aquí: {url}',

  twitter_enabled: false,
  twitter_api_key: '',
  twitter_api_secret: '',
  twitter_access_token: '',
  twitter_access_secret: '',
  twitter_oauth2_client_id: '',
  twitter_oauth2_client_secret: '',
  twitter_oauth2_access_token: '',
  twitter_oauth2_refresh_token: '',
  twitter_oauth2_expires_at: 0,
  twitter_oauth2_username: '',
  twitter_template: '🎁 {title}\n\n👉 {url}\n\n#regalos #ideaspararegalar #miregalo',

  medium_enabled: false,
  medium_integration_token: '',
  medium_publication_id: '',
  medium_publish_status: 'public',

  pinterest_enabled: false,
  pinterest_access_token: '',
  pinterest_board_name: 'Ideas de Regalos',
  pinterest_client_id: '',
  pinterest_client_secret: '',
  pinterest_refresh_token: '',
  pinterest_token_expires_at: 0,

  webhook_enabled: false,
  webhook_url: '',
  webhook_secret: '',
};

/**
 * Loads social settings from database
 */
export async function getSocialSettings(): Promise<SocialSettings> {
  try {
    const raw = await db.getSetting<Partial<SocialSettings>>('social_settings');
    if (!raw) return { ...DEFAULT_SOCIAL_SETTINGS };
    return {
      ...DEFAULT_SOCIAL_SETTINGS,
      ...raw,
      facebook_backfill: {
        ...DEFAULT_SOCIAL_SETTINGS.facebook_backfill,
        ...(raw.facebook_backfill || {}),
      },
    };
  } catch (err) {
    console.warn('[Social] Failed to load social_settings from DB:', err);
    return { ...DEFAULT_SOCIAL_SETTINGS };
  }
}

/**
 * Saves social settings to database
 */
export async function saveSocialSettings(settings: Partial<SocialSettings>): Promise<SocialSettings> {
  const current = await getSocialSettings();
  const merged: SocialSettings = { ...current, ...settings };
  await db.setSetting('social_settings', merged);
  return merged;
}

/**
 * Auto-shares a published post across all enabled social channels
 */
export async function sharePostToAllChannels(
  post: Post,
  options?: {
    forceChannels?: ('facebook' | 'twitter' | 'medium' | 'pinterest' | 'webhook')[];
    ignoreGlobalToggle?: boolean;
  }
): Promise<MultiShareReport> {
  const settings = await getSocialSettings();
  const results: Record<string, ChannelShareResult> = {};

  if (!settings.auto_share_enabled && !options?.ignoreGlobalToggle && !options?.forceChannels) {
    return {
      post_id: post.id,
      slug: post.slug,
      title: post.title,
      results,
      total_attempted: 0,
      total_success: 0,
    };
  }

  const tasks: Promise<ChannelShareResult>[] = [];

  // 1. Facebook Fanpage
  const shouldShareFb = options?.forceChannels?.includes('facebook') || (settings.facebook_enabled && settings.facebook_page_id && settings.facebook_access_token);
  if (shouldShareFb) {
    tasks.push(
      shareToFacebook(
        post,
        settings.facebook_page_id,
        settings.facebook_access_token,
        settings.facebook_template
      )
    );
  }

  // 2. X (Twitter)
  const hasTwitterCredentials = Boolean(
    (settings.twitter_oauth2_access_token || settings.twitter_oauth2_refresh_token) ||
    settings.twitter_oauth2_client_id ||
    (settings.twitter_api_key && settings.twitter_access_token)
  );
  const shouldShareTwitter = options?.forceChannels?.includes('twitter') || (settings.twitter_enabled && hasTwitterCredentials);
  if (shouldShareTwitter) {
    tasks.push(
      shareToTwitter(
        post,
        {
          apiKey: settings.twitter_api_key,
          apiSecret: settings.twitter_api_secret,
          accessToken: settings.twitter_access_token,
          accessSecret: settings.twitter_access_secret,
        },
        settings.twitter_template
      )
    );
  }

  // 3. Medium
  const shouldShareMedium = options?.forceChannels?.includes('medium') || (settings.medium_enabled && settings.medium_integration_token);
  if (shouldShareMedium) {
    tasks.push(
      shareToMedium(post, settings.medium_integration_token, {
        publicationId: settings.medium_publication_id || undefined,
        publishStatus: settings.medium_publish_status || 'public',
      })
    );
  }

  // 4. Pinterest
  const activePinterestToken = (settings.pinterest_access_token || process.env.PINTEREST_ACCESS_TOKEN || '').trim();
  const shouldSharePinterest =
    options?.forceChannels?.includes('pinterest') ||
    (settings.pinterest_enabled && Boolean(activePinterestToken));

  if (shouldSharePinterest && activePinterestToken) {
    tasks.push(
      (async (): Promise<ChannelShareResult> => {
        const timestamp = new Date().toISOString();
        try {
          const boardName = settings.pinterest_board_name?.trim() || undefined;
          const token = await getValidPinterestAccessToken(activePinterestToken);
          if (!token) throw new Error('Pinterest Access Token chưa được cấu hình.');
          const pinRes = await publishPostToPinterest(token, post, boardName);
          if (pinRes) {
            return {
              channel: 'pinterest',
              success: true,
              post_id: pinRes.id,
              url: `https://www.pinterest.com/pin/${pinRes.id}/`,
              message: `Đã ghim lên Pinterest thành công`,
              timestamp,
            };
          }
          return {
            channel: 'pinterest',
            success: false,
            error: 'Không tạo được Pin trên Pinterest',
            timestamp,
          };
        } catch (err: any) {
          return {
            channel: 'pinterest',
            success: false,
            error: err?.message || String(err),
            timestamp,
          };
        }
      })()
    );
  }

  // 5. Webhook (Make / Zapier / n8n)
  const shouldShareWebhook = options?.forceChannels?.includes('webhook') || (settings.webhook_enabled && settings.webhook_url);
  if (shouldShareWebhook) {
    tasks.push(triggerSocialWebhook(post, settings.webhook_url, settings.webhook_secret));
  }

  const settled = await Promise.allSettled(tasks);
  settled.forEach((res) => {
    if (res.status === 'fulfilled') {
      results[res.value.channel] = res.value;
    }
  });

  const totalAttempted = Object.keys(results).length;
  const totalSuccess = Object.values(results).filter((r) => r.success).length;

  console.log(`[Social Auto-Share] Post "${post.slug}" shared to ${totalSuccess}/${totalAttempted} channels:`, results);

  return {
    post_id: post.id,
    slug: post.slug,
    title: post.title,
    results,
    total_attempted: totalAttempted,
    total_success: totalSuccess,
  };
}
