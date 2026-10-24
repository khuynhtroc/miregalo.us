import { db } from '@/lib/db';
import type { Post } from '@/lib/types';
import type { SocialSettings, SocialChannelId, ChannelShareResult, MultiShareReport } from './types';
import { shareToFacebook, testFacebookConnection } from './facebook';
import { shareToInstagram, testInstagramConnection, resolveInstagramAccountInfo } from './instagram';
import { shareToTwitter, testTwitterConnection } from './twitter';
import { shareToMedium, testMediumConnection } from './medium';
import { getValidPinterestAccessToken, publishPostToPinterest } from './pinterest';
import { shareToTelegram, testTelegramConnection } from './telegram';
import { shareToBluesky, testBlueskyConnection } from './bluesky';
import { shareToThreads, testThreadsConnection } from './threads';
import { shareToMastodon, testMastodonConnection } from './mastodon';
import { shareToDiscord, testDiscordConnection } from './discord';
import { triggerSocialWebhook, testSocialWebhook } from './webhook';

export * from './types';
export * from './facebook';
export * from './instagram';
export * from './facebook-backfill';
export * from './twitter';
export * from './medium';
export * from './pinterest';
export * from './telegram';
export * from './bluesky';
export * from './threads';
export * from './mastodon';
export * from './discord';
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
  facebook_app_id: '1132334105813486',
  facebook_app_secret: '',
  facebook_template: '🎁 {title}\n\n{excerpt}\n\n👉 Descubre todas las ideas aquí: {url}',

  instagram_enabled: false,
  instagram_user_id: '',
  instagram_access_token: '',
  instagram_template:
    '🎁 {title}\n\n{excerpt}\n\n👉 Descubre la guía completa en: {url}\n\n#regalos #ideaspararegalar #miregalo #regalosoriginales #guiaDeRegalos',

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

  telegram_enabled: false,
  telegram_bot_token: '',
  telegram_chat_id: '',
  telegram_template: '🎁 {title}\n\n{excerpt}\n\n👉 Descubre todas las ideas aquí:\n{url}',

  bluesky_enabled: false,
  bluesky_identifier: '',
  bluesky_app_password: '',
  bluesky_template: '🎁 {title}\n\n👉 {url}\n\n#regalos #ideaspararegalar #miregalo',

  threads_enabled: false,
  threads_user_id: '',
  threads_access_token: '',
  threads_template: '🎁 {title}\n\n{excerpt}\n\n👉 {url}',

  mastodon_enabled: false,
  mastodon_instance_url: 'https://mastodon.social',
  mastodon_access_token: '',
  mastodon_template: '🎁 {title}\n\n{excerpt}\n\n👉 {url}\n\n#regalos #ideaspararegalar #miregalo',

  discord_enabled: false,
  discord_webhook_url: '',

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
    forceChannels?: SocialChannelId[];
    excludeChannels?: SocialChannelId[];
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

  const excluded = new Set<SocialChannelId>(options?.excludeChannels || []);
  const tasks: Promise<ChannelShareResult>[] = [];

  // 1. Facebook Fanpage
  const shouldShareFb =
    !excluded.has('facebook') &&
    (options?.forceChannels?.includes('facebook') ||
      (!options?.forceChannels && settings.facebook_enabled && settings.facebook_page_id && settings.facebook_access_token));
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

  // 1b. Instagram Business / Creator
  const igToken = (settings.instagram_access_token || settings.facebook_access_token || '').trim();
  const shouldShareInstagram =
    !excluded.has('instagram') &&
    (options?.forceChannels?.includes('instagram') ||
      (!options?.forceChannels && settings.instagram_enabled && Boolean(igToken)));
  if (shouldShareInstagram && igToken) {
    tasks.push(
      shareToInstagram(
        post,
        settings.instagram_user_id || '',
        igToken,
        settings.instagram_template,
        settings.facebook_page_id
      )
    );
  }

  // 2. X (Twitter)
  const hasTwitterCredentials = Boolean(
    settings.twitter_oauth2_access_token ||
      settings.twitter_oauth2_refresh_token ||
      settings.twitter_oauth2_client_id ||
      (settings.twitter_api_key && settings.twitter_access_token)
  );
  const shouldShareTwitter =
    !excluded.has('twitter') &&
    (options?.forceChannels?.includes('twitter') ||
      (!options?.forceChannels && settings.twitter_enabled && hasTwitterCredentials));
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
  const shouldShareMedium =
    !excluded.has('medium') &&
    (options?.forceChannels?.includes('medium') ||
      (!options?.forceChannels && settings.medium_enabled && settings.medium_integration_token));
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
    !excluded.has('pinterest') &&
    (options?.forceChannels?.includes('pinterest') ||
      (!options?.forceChannels && settings.pinterest_enabled && Boolean(activePinterestToken)));

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
              message: 'Đã ghim lên Pinterest thành công',
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

  // 5. Telegram Channel
  const shouldShareTelegram =
    !excluded.has('telegram') &&
    (options?.forceChannels?.includes('telegram') ||
      (!options?.forceChannels && settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id));
  if (shouldShareTelegram && settings.telegram_bot_token && settings.telegram_chat_id) {
    tasks.push(
      shareToTelegram(post, settings.telegram_bot_token, settings.telegram_chat_id, settings.telegram_template)
    );
  }

  // 6. Bluesky
  const shouldShareBluesky =
    !excluded.has('bluesky') &&
    (options?.forceChannels?.includes('bluesky') ||
      (!options?.forceChannels && settings.bluesky_enabled && settings.bluesky_identifier && settings.bluesky_app_password));
  if (shouldShareBluesky && settings.bluesky_identifier && settings.bluesky_app_password) {
    tasks.push(
      shareToBluesky(post, settings.bluesky_identifier, settings.bluesky_app_password, settings.bluesky_template)
    );
  }

  // 7. Threads by Meta
  const shouldShareThreads =
    !excluded.has('threads') &&
    (options?.forceChannels?.includes('threads') ||
      (!options?.forceChannels && settings.threads_enabled && settings.threads_access_token));
  if (shouldShareThreads && settings.threads_access_token) {
    tasks.push(
      shareToThreads(post, settings.threads_user_id || '', settings.threads_access_token, settings.threads_template)
    );
  }

  // 8. Mastodon
  const shouldShareMastodon =
    !excluded.has('mastodon') &&
    (options?.forceChannels?.includes('mastodon') ||
      (!options?.forceChannels && settings.mastodon_enabled && settings.mastodon_access_token));
  if (shouldShareMastodon && settings.mastodon_access_token) {
    tasks.push(
      shareToMastodon(
        post,
        settings.mastodon_instance_url || 'https://mastodon.social',
        settings.mastodon_access_token,
        settings.mastodon_template
      )
    );
  }

  // 9. Discord Channel Webhook
  const shouldShareDiscord =
    !excluded.has('discord') &&
    (options?.forceChannels?.includes('discord') ||
      (!options?.forceChannels && settings.discord_enabled && settings.discord_webhook_url));
  if (shouldShareDiscord && settings.discord_webhook_url) {
    tasks.push(shareToDiscord(post, settings.discord_webhook_url));
  }

  // 10. Webhook (Make / Zapier / n8n)
  const shouldShareWebhook =
    !excluded.has('webhook') &&
    (options?.forceChannels?.includes('webhook') ||
      (!options?.forceChannels && settings.webhook_enabled && settings.webhook_url));
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
