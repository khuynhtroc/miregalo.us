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
import { shareToLinkedIn, testLinkedInConnection, resolveLinkedInAuthorUrn } from './linkedin';
import { shareToHubSpot, testHubSpotConnection, resolveHubSpotBlogInfo } from './hubspot';
import { shareToDevTo, testDevToConnection } from './devto';
import { shareToWordPress, testWordPressConnection } from './wordpress';
import { shareToTumblr, testTumblrConnection } from './tumblr';
import { shareToBlogger, testBloggerConnection } from './blogger';
import { triggerSocialWebhook, testSocialWebhook } from './webhook';
import { shareToReddit, testRedditConnection } from './reddit';
import { shareToSlack, testSlackConnection } from './slack';
import { shareToGoogleBusiness, testGoogleBusinessConnection } from './google-business';
import { shareToHashnode, testHashnodeConnection } from './hashnode';
import { shareToVk, testVkConnection } from './vk';
import { shareToLemmy, testLemmyConnection } from './lemmy';
import { shareToWarpcast, testWarpcastConnection } from './warpcast';
import { shareToNostr, testNostrConnection } from './nostr';
import { shareToListmonk, testListmonkConnection } from './listmonk';
import {
  shareToTikTok,
  testTikTokConnection,
  shareToYouTube,
  testYouTubeConnection,
  shareToDribbble,
  testDribbbleConnection,
  shareToWhop,
  testWhopConnection,
  shareToTwitch,
  testTwitchConnection,
  shareToSkool,
  testSkoolConnection,
  shareToKick,
  testKickConnection,
  shareToMeWe,
  testMeWeConnection,
} from './extended-community';

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
export * from './linkedin';
export * from './hubspot';
export * from './devto';
export * from './wordpress';
export * from './tumblr';
export * from './blogger';
export * from './webhook';
export * from './reddit';
export * from './slack';
export * from './google-business';
export * from './hashnode';
export * from './vk';
export * from './lemmy';
export * from './warpcast';
export * from './nostr';
export * from './listmonk';
export * from './extended-community';

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
  facebook_app_id: '2272148170382644',
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

  linkedin_enabled: false,
  linkedin_access_token: '',
  linkedin_author_urn: '',
  linkedin_template: '🎁 {title}\n\n{excerpt}\n\n👉 {url}\n\n#regalos #ideaspararegalar #miregalo',

  hubspot_enabled: false,
  hubspot_access_token: '',
  hubspot_blog_id: '',

  devto_enabled: false,
  devto_api_key: '',

  wordpress_enabled: false,
  wordpress_site_url: '',
  wordpress_username: '',
  wordpress_app_password: '',

  tumblr_enabled: false,
  tumblr_blog_name: '',
  tumblr_access_token: '',

  blogger_enabled: false,
  blogger_blog_id: '',
  blogger_access_token: '',

  webhook_enabled: false,
  webhook_url: '',
  webhook_secret: '',

  // Extended
  tiktok_enabled: false,
  tiktok_webhook_url: '',
  tiktok_access_token: '',

  youtube_enabled: false,
  youtube_webhook_url: '',
  youtube_api_key: '',
  youtube_channel_id: '',

  google_business_enabled: false,
  google_business_webhook_url: '',
  google_business_account_id: '',
  google_business_location_id: '',
  google_business_access_token: '',

  reddit_enabled: false,
  reddit_webhook_url: '',
  reddit_client_id: '',
  reddit_client_secret: '',
  reddit_username: '',
  reddit_password: '',
  reddit_subreddit: '',

  slack_enabled: false,
  slack_webhook_url: '',
  slack_channel: '',

  dribbble_enabled: false,
  dribbble_webhook_url: '',
  dribbble_access_token: '',

  whop_enabled: false,
  whop_webhook_url: '',
  whop_api_key: '',
  whop_company_id: '',

  twitch_enabled: false,
  twitch_webhook_url: '',
  twitch_client_id: '',
  twitch_access_token: '',
  twitch_broadcaster_id: '',

  skool_enabled: false,
  skool_webhook_url: '',
  skool_community_id: '',

  kick_enabled: false,
  kick_webhook_url: '',
  kick_channel_id: '',

  warpcast_enabled: false,
  warpcast_webhook_url: '',
  warpcast_api_key: '',
  warpcast_signer_uuid: '',

  vk_enabled: false,
  vk_webhook_url: '',
  vk_access_token: '',
  vk_owner_id: '',

  lemmy_enabled: false,
  lemmy_webhook_url: '',
  lemmy_instance_url: '',
  lemmy_jwt_token: '',
  lemmy_community_id: '',

  mewe_enabled: false,
  mewe_webhook_url: '',
  mewe_access_token: '',

  nostr_enabled: false,
  nostr_webhook_url: '',
  nostr_private_key: '',
  nostr_relays: '',

  listmonk_enabled: false,
  listmonk_webhook_url: '',
  listmonk_url: '',
  listmonk_username: '',
  listmonk_password: '',
  listmonk_list_id: '',

  hashnode_enabled: false,
  hashnode_webhook_url: '',
  hashnode_access_token: '',
  hashnode_publication_id: '',
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

  // 10. LinkedIn
  const shouldShareLinkedIn =
    !excluded.has('linkedin') &&
    (options?.forceChannels?.includes('linkedin') ||
      (!options?.forceChannels && settings.linkedin_enabled && settings.linkedin_access_token));
  if (shouldShareLinkedIn && settings.linkedin_access_token) {
    tasks.push(
      shareToLinkedIn(
        post,
        settings.linkedin_access_token,
        settings.linkedin_author_urn,
        settings.linkedin_template
      )
    );
  }

  // 11. HubSpot CMS Blog (Hotspot)
  const shouldShareHubSpot =
    !excluded.has('hubspot') &&
    (options?.forceChannels?.includes('hubspot') ||
      (!options?.forceChannels && settings.hubspot_enabled && settings.hubspot_access_token));
  if (shouldShareHubSpot && settings.hubspot_access_token) {
    tasks.push(shareToHubSpot(post, settings.hubspot_access_token, settings.hubspot_blog_id));
  }

  // 12. Dev.to (Forem Canonical SEO)
  const shouldShareDevTo =
    !excluded.has('devto') &&
    (options?.forceChannels?.includes('devto') ||
      (!options?.forceChannels && settings.devto_enabled && settings.devto_api_key));
  if (shouldShareDevTo && settings.devto_api_key) {
    tasks.push(shareToDevTo(post, settings.devto_api_key));
  }

  // 13. WordPress.com / WordPress Web 2.0
  const shouldShareWordPress =
    !excluded.has('wordpress') &&
    (options?.forceChannels?.includes('wordpress') ||
      (!options?.forceChannels &&
        settings.wordpress_enabled &&
        settings.wordpress_site_url &&
        settings.wordpress_username &&
        settings.wordpress_app_password));
  if (
    shouldShareWordPress &&
    settings.wordpress_site_url &&
    settings.wordpress_username &&
    settings.wordpress_app_password
  ) {
    tasks.push(
      shareToWordPress(
        post,
        settings.wordpress_site_url,
        settings.wordpress_username,
        settings.wordpress_app_password
      )
    );
  }

  // 14. Tumblr
  const shouldShareTumblr =
    !excluded.has('tumblr') &&
    (options?.forceChannels?.includes('tumblr') ||
      (!options?.forceChannels && settings.tumblr_enabled && settings.tumblr_blog_name && settings.tumblr_access_token));
  if (shouldShareTumblr && settings.tumblr_blog_name && settings.tumblr_access_token) {
    tasks.push(shareToTumblr(post, settings.tumblr_blog_name, settings.tumblr_access_token));
  }

  // 15. Google Blogger / Blogspot
  const shouldShareBlogger =
    !excluded.has('blogger') &&
    (options?.forceChannels?.includes('blogger') ||
      (!options?.forceChannels && settings.blogger_enabled && settings.blogger_blog_id && settings.blogger_access_token));
  if (shouldShareBlogger && settings.blogger_blog_id && settings.blogger_access_token) {
    tasks.push(shareToBlogger(post, settings.blogger_blog_id, settings.blogger_access_token));
  }

  // 16. Webhook (Make / Zapier / n8n)
  const shouldShareWebhook =
    !excluded.has('webhook') &&
    (options?.forceChannels?.includes('webhook') ||
      (!options?.forceChannels && settings.webhook_enabled && settings.webhook_url));
  if (shouldShareWebhook) {
    tasks.push(triggerSocialWebhook(post, settings.webhook_url, settings.webhook_secret));
  }

  // 17. TikTok
  const shouldShareTikTok =
    !excluded.has('tiktok') &&
    (options?.forceChannels?.includes('tiktok') ||
      (!options?.forceChannels && settings.tiktok_enabled && (settings.tiktok_webhook_url || settings.tiktok_access_token)));
  if (shouldShareTikTok) {
    tasks.push(shareToTikTok(post, { webhookUrl: settings.tiktok_webhook_url, accessToken: settings.tiktok_access_token }));
  }

  // 18. YouTube
  const shouldShareYouTube =
    !excluded.has('youtube') &&
    (options?.forceChannels?.includes('youtube') ||
      (!options?.forceChannels && settings.youtube_enabled && (settings.youtube_webhook_url || settings.youtube_api_key)));
  if (shouldShareYouTube) {
    tasks.push(shareToYouTube(post, { webhookUrl: settings.youtube_webhook_url, apiKey: settings.youtube_api_key, channelId: settings.youtube_channel_id }));
  }

  // 19. Google My Business
  const shouldShareGmb =
    !excluded.has('google_business') &&
    (options?.forceChannels?.includes('google_business') ||
      (!options?.forceChannels && settings.google_business_enabled && (settings.google_business_webhook_url || settings.google_business_access_token)));
  if (shouldShareGmb) {
    tasks.push(
      shareToGoogleBusiness(post, {
        webhookUrl: settings.google_business_webhook_url,
        accountId: settings.google_business_account_id,
        locationId: settings.google_business_location_id,
        accessToken: settings.google_business_access_token,
      }, settings.google_business_template)
    );
  }

  // 20. Reddit
  const shouldShareReddit =
    !excluded.has('reddit') &&
    (options?.forceChannels?.includes('reddit') ||
      (!options?.forceChannels && settings.reddit_enabled && (settings.reddit_webhook_url || settings.reddit_client_id)));
  if (shouldShareReddit) {
    tasks.push(
      shareToReddit(post, {
        webhookUrl: settings.reddit_webhook_url,
        clientId: settings.reddit_client_id,
        clientSecret: settings.reddit_client_secret,
        username: settings.reddit_username,
        password: settings.reddit_password,
        subreddit: settings.reddit_subreddit,
      }, settings.reddit_template)
    );
  }

  // 21. Slack
  const shouldShareSlack =
    !excluded.has('slack') &&
    (options?.forceChannels?.includes('slack') ||
      (!options?.forceChannels && settings.slack_enabled && settings.slack_webhook_url));
  if (shouldShareSlack && settings.slack_webhook_url) {
    tasks.push(shareToSlack(post, settings.slack_webhook_url, settings.slack_channel, settings.slack_template));
  }

  // 22. Dribbble
  const shouldShareDribbble =
    !excluded.has('dribbble') &&
    (options?.forceChannels?.includes('dribbble') ||
      (!options?.forceChannels && settings.dribbble_enabled && (settings.dribbble_webhook_url || settings.dribbble_access_token)));
  if (shouldShareDribbble) {
    tasks.push(shareToDribbble(post, { webhookUrl: settings.dribbble_webhook_url, accessToken: settings.dribbble_access_token }));
  }

  // 23. Whop
  const shouldShareWhop =
    !excluded.has('whop') &&
    (options?.forceChannels?.includes('whop') ||
      (!options?.forceChannels && settings.whop_enabled && (settings.whop_webhook_url || settings.whop_api_key)));
  if (shouldShareWhop) {
    tasks.push(shareToWhop(post, { webhookUrl: settings.whop_webhook_url, apiKey: settings.whop_api_key, communityId: settings.whop_company_id }));
  }

  // 24. Twitch
  const shouldShareTwitch =
    !excluded.has('twitch') &&
    (options?.forceChannels?.includes('twitch') ||
      (!options?.forceChannels && settings.twitch_enabled && (settings.twitch_webhook_url || settings.twitch_access_token)));
  if (shouldShareTwitch) {
    tasks.push(shareToTwitch(post, { webhookUrl: settings.twitch_webhook_url, clientId: settings.twitch_client_id, accessToken: settings.twitch_access_token, broadcasterId: settings.twitch_broadcaster_id }));
  }

  // 25. Skool
  const shouldShareSkool =
    !excluded.has('skool') &&
    (options?.forceChannels?.includes('skool') ||
      (!options?.forceChannels && settings.skool_enabled && (settings.skool_webhook_url || settings.skool_community_id)));
  if (shouldShareSkool) {
    tasks.push(shareToSkool(post, { webhookUrl: settings.skool_webhook_url, communityId: settings.skool_community_id }));
  }

  // 26. Kick
  const shouldShareKick =
    !excluded.has('kick') &&
    (options?.forceChannels?.includes('kick') ||
      (!options?.forceChannels && settings.kick_enabled && (settings.kick_webhook_url || settings.kick_channel_id)));
  if (shouldShareKick) {
    tasks.push(shareToKick(post, { webhookUrl: settings.kick_webhook_url, channelId: settings.kick_channel_id }));
  }

  // 27. Warpcast
  const shouldShareWarpcast =
    !excluded.has('warpcast') &&
    (options?.forceChannels?.includes('warpcast') ||
      (!options?.forceChannels && settings.warpcast_enabled && (settings.warpcast_webhook_url || settings.warpcast_api_key)));
  if (shouldShareWarpcast) {
    tasks.push(shareToWarpcast(post, { webhookUrl: settings.warpcast_webhook_url, apiKey: settings.warpcast_api_key, signerUuid: settings.warpcast_signer_uuid }, settings.warpcast_template));
  }

  // 28. VK
  const shouldShareVk =
    !excluded.has('vk') &&
    (options?.forceChannels?.includes('vk') ||
      (!options?.forceChannels && settings.vk_enabled && (settings.vk_webhook_url || settings.vk_access_token)));
  if (shouldShareVk) {
    tasks.push(shareToVk(post, { webhookUrl: settings.vk_webhook_url, accessToken: settings.vk_access_token, ownerId: settings.vk_owner_id }, settings.vk_template));
  }

  // 29. Lemmy
  const shouldShareLemmy =
    !excluded.has('lemmy') &&
    (options?.forceChannels?.includes('lemmy') ||
      (!options?.forceChannels && settings.lemmy_enabled && (settings.lemmy_webhook_url || (settings.lemmy_instance_url && settings.lemmy_jwt_token))));
  if (shouldShareLemmy) {
    tasks.push(shareToLemmy(post, { webhookUrl: settings.lemmy_webhook_url, instanceUrl: settings.lemmy_instance_url, jwtToken: settings.lemmy_jwt_token, communityId: settings.lemmy_community_id }, settings.lemmy_template));
  }

  // 30. MeWe
  const shouldShareMeWe =
    !excluded.has('mewe') &&
    (options?.forceChannels?.includes('mewe') ||
      (!options?.forceChannels && settings.mewe_enabled && (settings.mewe_webhook_url || settings.mewe_access_token)));
  if (shouldShareMeWe) {
    tasks.push(shareToMeWe(post, { webhookUrl: settings.mewe_webhook_url, accessToken: settings.mewe_access_token }));
  }

  // 31. Nostr
  const shouldShareNostr =
    !excluded.has('nostr') &&
    (options?.forceChannels?.includes('nostr') ||
      (!options?.forceChannels && settings.nostr_enabled && (settings.nostr_webhook_url || settings.nostr_private_key)));
  if (shouldShareNostr) {
    tasks.push(shareToNostr(post, { webhookUrl: settings.nostr_webhook_url, privateKey: settings.nostr_private_key, relays: settings.nostr_relays }, settings.nostr_template));
  }

  // 32. Listmonk
  const shouldShareListmonk =
    !excluded.has('listmonk') &&
    (options?.forceChannels?.includes('listmonk') ||
      (!options?.forceChannels && settings.listmonk_enabled && (settings.listmonk_webhook_url || (settings.listmonk_url && settings.listmonk_username))));
  if (shouldShareListmonk) {
    tasks.push(shareToListmonk(post, { webhookUrl: settings.listmonk_webhook_url, url: settings.listmonk_url, username: settings.listmonk_username, password: settings.listmonk_password, listId: settings.listmonk_list_id }, settings.listmonk_template));
  }

  // 33. Hashnode
  const shouldShareHashnode =
    !excluded.has('hashnode') &&
    (options?.forceChannels?.includes('hashnode') ||
      (!options?.forceChannels && settings.hashnode_enabled && (settings.hashnode_webhook_url || (settings.hashnode_access_token && settings.hashnode_publication_id))));
  if (shouldShareHashnode) {
    tasks.push(shareToHashnode(post, { webhookUrl: settings.hashnode_webhook_url, accessToken: settings.hashnode_access_token, publicationId: settings.hashnode_publication_id }, settings.hashnode_template));
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
