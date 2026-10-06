-- ════════════════════════════════════════════════════════════════════
--  0002_admin_tables.sql – Catalog URLs, Merchants, GSC, Media, Analytics
--  Run in Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════

-- ── catalog_urls (92 Canonical Taxonomies / Silos) ──────────────────
create table if not exists public.catalog_urls (
  id                text primary key default gen_random_uuid()::text,
  url               text not null unique,
  page_title        text not null default '',
  url_type          text not null default '',
  parent_url        text not null default '',
  priority          text not null default 'P2',
  status            text not null default 'planned',
  notes             text not null default '',
  meta_description  text not null default '',
  h1                text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists catalog_urls_url_idx on public.catalog_urls (url);
create index if not exists catalog_urls_priority_idx on public.catalog_urls (priority);

-- ── merchants (Affiliate platforms: Amazon, Awin, eBay, Walmart...) ─
create table if not exists public.merchants (
  id                 text primary key default gen_random_uuid()::text,
  name               text not null,
  slug               text not null unique,
  website_url        text not null default '',
  affiliate_network  text not null default '',
  affiliate_param    text not null default '',
  commission_rate    text not null default '',
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── gsc_opportunities (Search Console SEO Recommendations) ──────────
create table if not exists public.gsc_opportunities (
  id                  text primary key default gen_random_uuid()::text,
  type                text not null default '',
  query               text not null default '',
  page                text not null default '',
  impressions         int not null default 0,
  clicks              int not null default 0,
  current_position    real not null default 0,
  expected_ctr        real not null default 0,
  actual_ctr          real not null default 0,
  potential_clicks    int not null default 0,
  action_recommended  text not null default '',
  status              text not null default 'open',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── media (Media Library / Cloudflare R2 / Supabase Storage) ─────────
create table if not exists public.media (
  id                text primary key default gen_random_uuid()::text,
  name              text not null,
  original_name     text not null default '',
  url               text not null,
  storage_provider  text not null default 'local',
  size_bytes        bigint not null default 0,
  mime_type         text not null default '',
  width             int,
  height            int,
  alt_text          text not null default '',
  remote_key        text not null default '',
  synced_to_cloud   boolean not null default false,
  used_in           jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── storage_settings (Multi-cloud settings: R2 / Supabase) ──────────
create table if not exists public.storage_settings (
  id              text primary key default 'storage-settings-main',
  provider        text not null default 'local',
  cloudflare      jsonb not null default '{}'::jsonb,
  supabase        jsonb not null default '{}'::jsonb,
  auto_sync       boolean not null default true,
  last_synced_at  timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── analytics (Google Analytics & Traffic Attribution Telemetry) ────
create table if not exists public.analytics (
  id                    text primary key default 'analytics-main',
  period                text not null default '30d',
  total_sessions        int not null default 0,
  total_users           int not null default 0,
  total_pageviews       int not null default 0,
  bounce_rate           real not null default 0,
  avg_session_duration  text not null default '0m 00s',
  ga4_measurement_id    text not null default '',
  gsc_property          text not null default '',
  last_updated          timestamptz not null default now(),
  channels              jsonb not null default '[]'::jsonb,
  top_landing_pages     jsonb not null default '[]'::jsonb,
  device_split          jsonb not null default '[]'::jsonb,
  geo_split             jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.catalog_urls       enable row level security;
alter table public.merchants          enable row level security;
alter table public.gsc_opportunities  enable row level security;
alter table public.media              enable row level security;
alter table public.storage_settings   enable row level security;
alter table public.analytics          enable row level security;

drop policy if exists "public read catalog_urls"      on public.catalog_urls;
drop policy if exists "public read merchants"         on public.merchants;
drop policy if exists "public read gsc_opportunities" on public.gsc_opportunities;
drop policy if exists "public read media"             on public.media;
drop policy if exists "public read storage_settings"  on public.storage_settings;
drop policy if exists "public read analytics"         on public.analytics;

create policy "public read catalog_urls"      on public.catalog_urls      for select using (true);
create policy "public read merchants"         on public.merchants         for select using (active);
create policy "public read gsc_opportunities" on public.gsc_opportunities for select using (true);
create policy "public read media"             on public.media             for select using (true);
create policy "public read storage_settings"  on public.storage_settings  for select using (true);
create policy "public read analytics"         on public.analytics         for select using (true);
