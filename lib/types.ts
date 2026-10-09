// Core domain types shared by frontend, admin, API and DB drivers.

export type PostType = 'gift' | 'blog' | 'page';
export type PostStatus = 'draft' | 'published' | 'planned' | 'archived';
export type CategoryGroup = 'hub' | 'recipients' | 'occasions' | 'interests' | 'blog';

export interface FaqItem {
  q: string;
  a: string; // HTML allowed
}

/** One numbered pick inside a gift guide (product card). */
export interface GiftItem {
  product_id?: string | null; // optional link to products library (affiliate)
  heading: string;
  image?: string;
  url?: string; // direct url if no product_id
  merchant?: string;
  price?: string;
  description_html?: string;
  pros?: string[];
  cons?: string[];
  button_label?: string;
}

export interface Post {
  id: string;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string;
  intro_html: string; // gift guides: intro above the list. blog/page: unused
  content_html: string; // blog/page: full body. gift guides: "bottom line" section
  items: GiftItem[];
  faqs: FaqItem[];
  hero_image: string;
  hero_alt: string;
  primary_category_id: string | null;
  category_ids: string[];
  author_id: string | null;
  status: PostStatus;
  featured: boolean;
  editor_pick: boolean;
  focus_keyword: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots: string;
  og_image: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  group: CategoryGroup;
  eyebrow: string;
  short_intro: string;
  description_html: string;
  hero_image: string;
  seo_title: string;
  seo_description: string;
  sort_order: number;
  show_in_nav: boolean;
  show_in_footer: boolean;
  quick_link: boolean;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  entity_type: 'Organization' | 'Person';
  job_title: string;
  bio_html: string;
  avatar: string;
  email: string;
  website: string;
  same_as: string[];
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  affiliate_network?: string;
  affiliate_param?: string;
  commission_rate?: string;
  logo_url?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogUrl {
  id: string; // e.g. URL-001
  url: string; // e.g. /regalos/para-mama/
  page_title: string; // e.g. Regalos para Mamá
  url_type: 'ROOT' | 'SILO' | 'RECIPIENT' | 'RECIPIENT_ATTRIBUTE' | 'RECIPIENT_PROBLEM' | 'RECIPIENT_URGENCY' | 'OCCASION' | 'STYLE';
  parent_url: string;
  priority: 'P1' | 'P2' | 'P3' | string;
  status: 'CREATE' | 'LIVE' | 'REVIEW';
  notes?: string;
  meta_description?: string;
  h1?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductContainingPost {
  id: string;
  title: string;
  slug: string;
  url: string;
}

export interface ProductTrafficSources {
  organic_google: number;
  direct: number;
  social: number;
  referral: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  url: string; // affiliate destination
  merchant: string;
  merchant_id?: string;
  image: string;
  price: string;
  currency: string;
  description: string;
  tags: string[];
  clicks: number;
  impressions?: number;
  ctr?: number;
  containing_posts?: ProductContainingPost[];
  traffic_sources?: ProductTrafficSources;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Redirect {
  id: string;
  source: string; // path, e.g. /old-slug/
  destination: string; // path or absolute URL
  code: 301 | 302 | 308;
  hits: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Content plan / keyword map (seeded from the 500 keyword dataset & source URL map). */
export interface Keyword {
  id: string;
  keyword: string;
  target_path: string;
  post_type: PostType;
  cluster: string;
  intent: string;
  volume: number;
  difficulty: number;
  priority: number | string;
  status: 'planned' | 'researching' | 'writing' | 'review' | 'published' | 'skipped';
  post_id: string | null;
  action?: 'PRIMARY' | 'MERGE' | string;
  target_url_id?: string;
  parent_url?: string;
  silo?: string;
  recipient?: string;
  occasion?: string;
  budget?: string;
  culture?: string;
  page_type?: string;
  validation?: string;
  url_decision?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  organization_name: string;
  organization_url: string;
  logo_url: string;
  logo_fullsize_url: string;
  favicon_url: string;
  default_og_image: string;
  locale: string;
  title_separator: string;
  shop_url: string;
  shop_label: string;
  contact_url: string;
  copyright: string;
  footer_tagline: string;
  footer_about: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_lead: string;
  search_placeholder: string;
  cta_eyebrow: string;
  cta_title: string;
  cta_text: string;
  affiliate_disclosure: string;
  posts_per_page: number;
  ga4_id: string;
  gsc_verification: string;
  gsc_property: string;
  bing_verification: string;
  pinterest_verification?: string;
  pinterest_tag_id?: string;
  head_scripts: string;
  body_scripts: string;
  robots_extra: string;
  noindex_site: boolean;
  google_search_cx?: string;
  amazon_associates_tag?: string;
  awin_affiliate_id?: string;
  ebay_campaign_id?: string;
  walmart_partner_id?: string;
  default_affiliate_strategy?: string;
}

export interface ContentJob {
  id: string;
  keyword_id?: string | null;
  target_path?: string | null;
  topic?: string;
  status?: 'queued' | 'researching' | 'generating' | 'completed' | 'failed' | 'scheduled' | 'processing' | 'published';
  stage?: string;
  payload?: any;
  result?: any;
  model?: string;
  prompt?: string | null;
  generated_post_id?: string | null;
  attempts?: number;
  max_attempts?: number;
  retry_after?: string | null;
  duration_ms?: number;
  log?: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalLink {
  id: string;
  source_post_id: string;
  target_post_id?: string | null;
  target_url?: string | null;
  anchor_text: string;
  rel?: string | null;
  created_at: string;
}

export interface GscMetric {
  id: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
  created_at: string;
}

export interface GscOpportunity {
  id: string;
  type: 'striking_distance' | 'low_ctr' | 'decaying' | 'unindexed';
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  current_position: number;
  expected_ctr: number;
  actual_ctr: number;
  potential_clicks: number;
  action_recommended: string;
  status: 'pending' | 'applied' | 'ignored';
  created_at: string;
}

export interface MediaFile {
  id: string;
  name: string;
  original_name: string;
  url: string; // Public CDN or local URL
  storage_provider: 'local' | 'cloudflare_r2' | 'supabase';
  size_bytes: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  remote_key?: string;
  synced_to_cloud: boolean;
  used_in?: { type: 'post' | 'product'; id: string; title: string; url: string }[];
  created_at: string;
  updated_at: string;
}

export interface CloudStorageSettings {
  id?: string;
  provider: 'local' | 'cloudflare_r2' | 'supabase';
  cloudflare?: {
    account_id: string;
    access_key_id: string;
    secret_access_key: string;
    bucket_name: string;
    public_domain: string;
    endpoint?: string;
  };
  supabase?: {
    project_url: string;
    service_role_key: string;
    bucket_name: string;
    public_url?: string;
  };
  auto_sync: boolean;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsTrafficChannel {
  channel: string;
  sessions: number;
  users: number;
  bounce_rate: number;
  avg_duration_sec: number;
  conversion_rate: number;
  percentage: number;
  color: string;
}

export interface AnalyticsTopLandingPage {
  path: string;
  title: string;
  pageviews: number;
  unique_visitors: number;
  outbound_clicks: number;
  ctr: number;
}

export interface AnalyticsOverview {
  id?: string;
  period: string;
  total_sessions: number;
  total_users: number;
  total_pageviews: number;
  bounce_rate: number;
  avg_session_duration: string;
  channels: AnalyticsTrafficChannel[];
  top_landing_pages: AnalyticsTopLandingPage[];
  device_split: { device: string; percentage: number }[];
  geo_split: { country: string; flag: string; percentage: number; users: number }[];
  ga4_measurement_id?: string;
  gsc_property?: string;
  last_updated: string;
}

export type TableName =
  | 'posts'
  | 'categories'
  | 'authors'
  | 'products'
  | 'redirects'
  | 'keywords'
  | 'content_jobs'
  | 'internal_links'
  | 'catalog_urls'
  | 'merchants'
  | 'gsc_metrics'
  | 'gsc_opportunities'
  | 'media'
  | 'storage_settings'
  | 'analytics';

export interface TableRowMap {
  posts: Post;
  categories: Category;
  authors: Author;
  products: Product;
  redirects: Redirect;
  keywords: Keyword;
  content_jobs: ContentJob;
  internal_links: InternalLink;
  catalog_urls: CatalogUrl;
  merchants: Merchant;
  gsc_metrics: GscMetric;
  gsc_opportunities: GscOpportunity;
  media: MediaFile;
  storage_settings: CloudStorageSettings;
  analytics: AnalyticsOverview;
}

