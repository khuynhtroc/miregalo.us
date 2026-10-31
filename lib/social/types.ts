export type SocialChannelId =
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'twitter'
  | 'linkedin'
  | 'bluesky'
  | 'pinterest'
  | 'telegram'
  | 'discord'
  | 'mastodon'
  | 'medium'
  | 'devto'
  | 'wordpress'
  | 'hubspot'
  | 'tumblr'
  | 'blogger'
  | 'webhook'
  // Extended Channels from Matrix
  | 'tiktok'
  | 'youtube'
  | 'google_business'
  | 'reddit'
  | 'slack'
  | 'dribbble'
  | 'whop'
  | 'twitch'
  | 'skool'
  | 'kick'
  | 'warpcast'
  | 'vk'
  | 'lemmy'
  | 'mewe'
  | 'nostr'
  | 'listmonk'
  | 'hashnode';

export interface SocialSettings {
  auto_share_enabled: boolean;

  // Historical-post backfill queue (oldest -> newest)
  facebook_backfill: FacebookBackfillState;

  // 1. Facebook Fanpage
  facebook_enabled: boolean;
  facebook_page_id: string;
  facebook_access_token: string;
  facebook_app_id?: string;
  facebook_app_secret?: string;
  facebook_template?: string;

  // 1b. Instagram Business / Creator (Graph API)
  instagram_enabled?: boolean;
  instagram_user_id?: string;
  instagram_access_token?: string;
  instagram_template?: string;

  // 2. X (Twitter)
  twitter_enabled: boolean;
  twitter_api_key: string;
  twitter_api_secret: string;
  twitter_access_token: string;
  twitter_access_secret: string;
  twitter_template?: string;
  // X OAuth 2.0 (confidential Web App)
  twitter_oauth2_client_id?: string;
  twitter_oauth2_client_secret?: string;
  twitter_oauth2_access_token?: string;
  twitter_oauth2_refresh_token?: string;
  twitter_oauth2_expires_at?: number;
  twitter_oauth2_username?: string;

  // 3. Medium
  medium_enabled: boolean;
  medium_integration_token: string;
  medium_publication_id?: string;
  medium_publish_status?: 'public' | 'draft' | 'unlisted';

  // 4. Pinterest
  pinterest_enabled: boolean;
  pinterest_access_token: string;
  pinterest_board_name?: string;
  pinterest_client_id?: string;
  pinterest_client_secret?: string;
  pinterest_refresh_token?: string;
  pinterest_token_expires_at?: number;

  // 5. Telegram Channel (Bot API)
  telegram_enabled?: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_template?: string;

  // 6. Bluesky (AT Protocol - Handle + App Password)
  bluesky_enabled?: boolean;
  bluesky_identifier?: string;
  bluesky_app_password?: string;
  bluesky_template?: string;

  // 7. Threads by Meta (Graph Threads API)
  threads_enabled?: boolean;
  threads_user_id?: string;
  threads_access_token?: string;
  threads_template?: string;

  // 8. Mastodon (Open Social API)
  mastodon_enabled?: boolean;
  mastodon_instance_url?: string;
  mastodon_access_token?: string;
  mastodon_template?: string;

  // 9. Discord Channel Webhook
  discord_enabled?: boolean;
  discord_webhook_url?: string;

  // 10. LinkedIn (Profile / Company Page)
  linkedin_enabled?: boolean;
  linkedin_access_token?: string;
  linkedin_author_urn?: string;
  linkedin_template?: string;

  // 11. HubSpot CMS Blog (Hotspot)
  hubspot_enabled?: boolean;
  hubspot_access_token?: string;
  hubspot_blog_id?: string;

  // 12. Dev.to (Forem Canonical SEO)
  devto_enabled?: boolean;
  devto_api_key?: string;

  // 13. WordPress.com / WordPress Web 2.0
  wordpress_enabled?: boolean;
  wordpress_site_url?: string;
  wordpress_username?: string;
  wordpress_app_password?: string;

  // 14. Tumblr (Web 2.0 Backlink)
  tumblr_enabled?: boolean;
  tumblr_blog_name?: string;
  tumblr_access_token?: string;

  // 15. Google Blogger / Blogspot
  blogger_enabled?: boolean;
  blogger_blog_id?: string;
  blogger_access_token?: string;

  // 16. Webhook (Make / Zapier / n8n)
  webhook_enabled: boolean;
  webhook_url: string;
  webhook_secret?: string;

  // 17. TikTok
  tiktok_enabled?: boolean;
  tiktok_access_token?: string;
  tiktok_open_id?: string;
  tiktok_webhook_url?: string;
  tiktok_template?: string;

  // 18. YouTube
  youtube_enabled?: boolean;
  youtube_api_key?: string;
  youtube_channel_id?: string;
  youtube_webhook_url?: string;
  youtube_template?: string;

  // 19. Google My Business
  google_business_enabled?: boolean;
  google_business_account_id?: string;
  google_business_location_id?: string;
  google_business_access_token?: string;
  google_business_webhook_url?: string;
  google_business_template?: string;

  // 20. Reddit
  reddit_enabled?: boolean;
  reddit_client_id?: string;
  reddit_client_secret?: string;
  reddit_username?: string;
  reddit_password?: string;
  reddit_subreddit?: string;
  reddit_webhook_url?: string;
  reddit_template?: string;

  // 21. Slack
  slack_enabled?: boolean;
  slack_webhook_url?: string;
  slack_channel?: string;
  slack_template?: string;

  // 22. Dribbble
  dribbble_enabled?: boolean;
  dribbble_access_token?: string;
  dribbble_webhook_url?: string;
  dribbble_template?: string;

  // 23. Whop
  whop_enabled?: boolean;
  whop_api_key?: string;
  whop_company_id?: string;
  whop_webhook_url?: string;
  whop_template?: string;

  // 24. Twitch
  twitch_enabled?: boolean;
  twitch_client_id?: string;
  twitch_access_token?: string;
  twitch_broadcaster_id?: string;
  twitch_webhook_url?: string;
  twitch_template?: string;

  // 25. Skool
  skool_enabled?: boolean;
  skool_community_id?: string;
  skool_webhook_url?: string;
  skool_template?: string;

  // 26. Kick
  kick_enabled?: boolean;
  kick_channel_id?: string;
  kick_webhook_url?: string;
  kick_template?: string;

  // 27. Warpcast (Farcaster)
  warpcast_enabled?: boolean;
  warpcast_api_key?: string;
  warpcast_signer_uuid?: string;
  warpcast_webhook_url?: string;
  warpcast_template?: string;

  // 28. VK (VKontakte)
  vk_enabled?: boolean;
  vk_access_token?: string;
  vk_owner_id?: string;
  vk_webhook_url?: string;
  vk_template?: string;

  // 29. Lemmy
  lemmy_enabled?: boolean;
  lemmy_instance_url?: string;
  lemmy_jwt_token?: string;
  lemmy_community_id?: string;
  lemmy_webhook_url?: string;
  lemmy_template?: string;

  // 30. MeWe
  mewe_enabled?: boolean;
  mewe_access_token?: string;
  mewe_webhook_url?: string;
  mewe_template?: string;

  // 31. Nostr
  nostr_enabled?: boolean;
  nostr_private_key?: string;
  nostr_relays?: string;
  nostr_webhook_url?: string;
  nostr_template?: string;

  // 32. Listmonk
  listmonk_enabled?: boolean;
  listmonk_url?: string;
  listmonk_username?: string;
  listmonk_password?: string;
  listmonk_list_id?: string;
  listmonk_webhook_url?: string;
  listmonk_template?: string;

  // 33. Hashnode
  hashnode_enabled?: boolean;
  hashnode_access_token?: string;
  hashnode_publication_id?: string;
  hashnode_webhook_url?: string;
  hashnode_template?: string;
}

export interface FacebookBackfillState {
  status: 'idle' | 'scheduled' | 'paused' | 'error' | 'completed';
  queue_id: string | null;
  post_ids: string[];
  cursor: number;
  interval_minutes: number;
  start_at: string | null;
  next_post_at: string | null;
  started_at: string | null;
  last_posted_at: string | null;
  last_post_title: string | null;
  last_error: string | null;
  skipped_count: number;
  lock_id: string | null;
  lock_until: string | null;
  channels?: SocialChannelId[];
  last_channels_posted?: string[];
}

export interface ChannelShareResult {
  channel: SocialChannelId;
  success: boolean;
  post_id?: string;
  postId?: string;
  url?: string;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface MultiShareReport {
  post_id: string;
  slug: string;
  title: string;
  results: Record<string, ChannelShareResult>;
  total_attempted: number;
  total_success: number;
}
