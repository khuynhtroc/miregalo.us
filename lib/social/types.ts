export type SocialChannelId =
  | 'facebook'
  | 'twitter'
  | 'medium'
  | 'pinterest'
  | 'telegram'
  | 'bluesky'
  | 'threads'
  | 'mastodon'
  | 'discord'
  | 'webhook';

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

  // 10. Webhook (Make / Zapier / n8n)
  webhook_enabled: boolean;
  webhook_url: string;
  webhook_secret?: string;
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
}

export interface ChannelShareResult {
  channel: SocialChannelId;
  success: boolean;
  post_id?: string;
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
