-- ════════════════════════════════════════════════════════════════════
--  MIREGALO.US – FULL SUPABASE SCHEMA (0001_init + 0002_admin_tables)
--  Paste this entire file into Supabase SQL Editor -> Click RUN
--  URL: https://supabase.com/dashboard/project/cewrrewgnziioyujlseg/sql/new
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── settings (key/value JSON) ───────────────────────────────────────
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ── authors ─────────────────────────────────────────────────────────
create table if not exists public.authors (
  id           text primary key default gen_random_uuid()::text,
  slug         text not null unique,
  name         text not null,
  entity_type  text not null default 'Organization' check (entity_type in ('Organization','Person')),
  job_title    text not null default '',
  bio_html     text not null default '',
  avatar       text not null default '',
  email        text not null default '',
  website      text not null default '',
  same_as      text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── categories (hubs + taxonomies) ─────────────────────────────────
create table if not exists public.categories (
  id                text primary key default gen_random_uuid()::text,
  slug              text not null unique,
  name              text not null,
  "group"           text not null check ("group" in ('hub','recipients','occasions','interests','blog')),
  eyebrow           text not null default '',
  short_intro       text not null default '',
  description_html  text not null default '',
  hero_image        text not null default '',
  seo_title         text not null default '',
  seo_description   text not null default '',
  sort_order        int  not null default 0,
  show_in_nav       boolean not null default true,
  show_in_footer    boolean not null default true,
  quick_link        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── posts (gift guides, blog posts, static pages) ──────────────────
create table if not exists public.posts (
  id                   text primary key default gen_random_uuid()::text,
  type                 text not null default 'gift' check (type in ('gift','blog','page')),
  slug                 text not null,
  title                text not null,
  excerpt              text not null default '',
  intro_html           text not null default '',
  content_html         text not null default '',
  items                jsonb not null default '[]'::jsonb,
  faqs                 jsonb not null default '[]'::jsonb,
  hero_image           text not null default '',
  hero_alt             text not null default '',
  primary_category_id  text references public.categories(id) on delete set null,
  category_ids         text[] not null default '{}',
  author_id            text references public.authors(id) on delete set null,
  status               text not null default 'draft' check (status in ('draft','published','planned','archived')),
  featured             boolean not null default false,
  editor_pick          boolean not null default false,
  focus_keyword        text not null default '',
  seo_title            text not null default '',
  seo_description      text not null default '',
  canonical_url        text not null default '',
  robots               text not null default '',
  og_image             text not null default '',
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (type, slug)
);
create index if not exists posts_status_pub_idx on public.posts (status, published_at desc);
create index if not exists posts_category_ids_idx on public.posts using gin (category_ids);
create index if not exists posts_type_idx on public.posts (type);

-- ── products (affiliate library) ───────────────────────────────────
create table if not exists public.products (
  id           text primary key default gen_random_uuid()::text,
  slug         text not null unique,
  name         text not null,
  url          text not null default '',
  merchant     text not null default '',
  image        text not null default '',
  price        text not null default '',
  currency     text not null default 'USD',
  description  text not null default '',
  tags         text[] not null default '{}',
  clicks       int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── redirects (301/302 manager) ────────────────────────────────────
create table if not exists public.redirects (
  id           text primary key default gen_random_uuid()::text,
  source       text not null unique,
  destination  text not null,
  code         int not null default 301 check (code in (301,302,308)),
  hits         int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── AI Content Engine tables ────────────────────────────────────────
create table if not exists public.keywords (
  id           text primary key default gen_random_uuid()::text,
  keyword      text not null,
  target_path  text not null default '',
  post_type    text not null default 'gift' check (post_type in ('gift','blog','page')),
  cluster      text not null default '',
  intent       text not null default '',
  volume       int not null default 0,
  difficulty   int not null default 0,
  priority     int not null default 0,
  status       text not null default 'planned'
               check (status in ('planned','researching','writing','review','published','skipped')),
  post_id      text references public.posts(id) on delete set null,
  notes        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists keywords_status_idx on public.keywords (status, priority desc);

create table if not exists public.content_jobs (
  id          text primary key default gen_random_uuid()::text,
  keyword_id  text references public.keywords(id) on delete cascade,
  stage       text not null default 'research'
              check (stage in ('research','outline','draft','seo','products','internal_links','review','done','error')),
  payload     jsonb not null default '{}'::jsonb,
  result      jsonb not null default '{}'::jsonb,
  error       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.internal_links (
  id              text primary key default gen_random_uuid()::text,
  source_post_id  text references public.posts(id) on delete cascade,
  target_post_id  text references public.posts(id) on delete cascade,
  anchor          text not null default '',
  status          text not null default 'suggested' check (status in ('suggested','applied','rejected')),
  created_at      timestamptz not null default now()
);

create table if not exists public.gsc_metrics (
  id           bigserial primary key,
  date         date not null,
  page         text not null default '',
  query        text not null default '',
  clicks       int not null default 0,
  impressions  int not null default 0,
  ctr          real not null default 0,
  position     real not null default 0,
  unique (date, page, query)
);

-- ── Admin tables (0002_admin_tables.sql) ────────────────────────────
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

-- ── counter helper used by driver.increment() ──────────────────────
create or replace function public.increment_counter(p_table text, p_id text, p_field text)
returns void language plpgsql security definer as $$
begin
  if p_table not in ('products','redirects') or p_field not in ('clicks','hits') then
    raise exception 'not allowed';
  end if;
  execute format('update public.%I set %I = %I + 1 where id = $1', p_table, p_field, p_field) using p_id;
end $$;

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.settings          enable row level security;
alter table public.authors           enable row level security;
alter table public.categories        enable row level security;
alter table public.posts             enable row level security;
alter table public.products          enable row level security;
alter table public.redirects         enable row level security;
alter table public.keywords          enable row level security;
alter table public.content_jobs      enable row level security;
alter table public.internal_links    enable row level security;
alter table public.gsc_metrics       enable row level security;
alter table public.catalog_urls      enable row level security;
alter table public.merchants         enable row level security;
alter table public.gsc_opportunities enable row level security;
alter table public.media             enable row level security;
alter table public.storage_settings  enable row level security;
alter table public.analytics         enable row level security;

drop policy if exists "public read settings"          on public.settings;
drop policy if exists "public read authors"           on public.authors;
drop policy if exists "public read categories"        on public.categories;
drop policy if exists "public read posts"             on public.posts;
drop policy if exists "public read products"          on public.products;
drop policy if exists "public read redirects"         on public.redirects;
drop policy if exists "public read catalog_urls"      on public.catalog_urls;
drop policy if exists "public read merchants"         on public.merchants;
drop policy if exists "public read gsc_opportunities" on public.gsc_opportunities;
drop policy if exists "public read media"             on public.media;
drop policy if exists "public read storage_settings"  on public.storage_settings;
drop policy if exists "public read analytics"         on public.analytics;

create policy "public read settings"          on public.settings          for select using (true);
create policy "public read authors"           on public.authors           for select using (true);
create policy "public read categories"        on public.categories        for select using (true);
create policy "public read posts"             on public.posts             for select using (status = 'published');
create policy "public read products"          on public.products          for select using (active);
create policy "public read redirects"         on public.redirects         for select using (active);
create policy "public read catalog_urls"      on public.catalog_urls      for select using (true);
create policy "public read merchants"         on public.merchants         for select using (active);
create policy "public read gsc_opportunities" on public.gsc_opportunities for select using (true);
create policy "public read media"             on public.media             for select using (true);
create policy "public read storage_settings"  on public.storage_settings  for select using (true);
create policy "public read analytics"         on public.analytics         for select using (true);

