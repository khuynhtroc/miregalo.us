export interface SocialSettings {
  auto_share_enabled: boolean;

  // Facebook Fanpage
  facebook_enabled: boolean;
  facebook_page_id: string;
  facebook_access_token: string;
  facebook_template?: string;

  // X (Twitter)
  twitter_enabled: boolean;
  twitter_api_key: string;
  twitter_api_secret: string;
  twitter_access_token: string;
  twitter_access_secret: string;
  twitter_template?: string;

  // Medium
  medium_enabled: boolean;
  medium_integration_token: string;
  medium_publication_id?: string;
  medium_publish_status?: 'public' | 'draft' | 'unlisted';

  // Pinterest
  pinterest_enabled: boolean;
  pinterest_access_token: string;
  pinterest_board_name?: string;

  // Webhook (Make / Zapier / n8n)
  webhook_enabled: boolean;
  webhook_url: string;
  webhook_secret?: string;
}

export interface ChannelShareResult {
  channel: 'facebook' | 'twitter' | 'medium' | 'pinterest' | 'webhook';
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
