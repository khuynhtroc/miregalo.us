-- ════════════════════════════════════════════════════════════════════
--  Gift blog – Supabase schema (Phase 1 + Phase 2 tables prepared)
--  Run in Supabase SQL editor or `supabase db push`.
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
  id           uuid primary key default gen_random_uuid(),
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
  id                uuid primary key default gen_random_uuid(),
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
  id                   uuid primary key default gen_random_uuid(),
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
  primary_category_id  uuid references public.categories(id) on delete set null,
  category_ids         uuid[] not null default '{}',
  author_id            uuid references public.authors(id) on delete set null,
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
  id           uuid primary key default gen_random_uuid(),
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
  id           uuid primary key default gen_random_uuid(),
  source       text not null unique,
  destination  text not null,
  code         int not null default 301 check (code in (301,302,308)),
  hits         int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
--  PHASE 2 – AI Content Engine tables (prepared, used later)
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.keywords (
  id           uuid primary key default gen_random_uuid(),
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
  post_id      uuid references public.posts(id) on delete set null,
  notes        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists keywords_status_idx on public.keywords (status, priority desc);

create table if not exists public.content_jobs (
  id          uuid primary key default gen_random_uuid(),
  keyword_id  uuid references public.keywords(id) on delete cascade,
  stage       text not null default 'research'
              check (stage in ('research','outline','draft','seo','products','internal_links','review','done','error')),
  payload     jsonb not null default '{}'::jsonb,
  result      jsonb not null default '{}'::jsonb,
  error       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.internal_links (
  id              uuid primary key default gen_random_uuid(),
  source_post_id  uuid references public.posts(id) on delete cascade,
  target_post_id  uuid references public.posts(id) on delete cascade,
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

-- ── counter helper used by driver.increment() ──────────────────────
create or replace function public.increment_counter(p_table text, p_id uuid, p_field text)
returns void language plpgsql security definer as $$
begin
  if p_table not in ('products','redirects') or p_field not in ('clicks','hits') then
    raise exception 'not allowed';
  end if;
  execute format('update public.%I set %I = %I + 1 where id = $1', p_table, p_field, p_field) using p_id;
end $$;

-- ── Row Level Security: public can read published content only ─────
alter table public.settings       enable row level security;
alter table public.authors        enable row level security;
alter table public.categories     enable row level security;
alter table public.posts          enable row level security;
alter table public.products       enable row level security;
alter table public.redirects      enable row level security;
alter table public.keywords       enable row level security;
alter table public.content_jobs   enable row level security;
alter table public.internal_links enable row level security;
alter table public.gsc_metrics    enable row level security;

drop policy if exists "public read settings"   on public.settings;
drop policy if exists "public read authors"    on public.authors;
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read posts"      on public.posts;
drop policy if exists "public read products"   on public.products;
drop policy if exists "public read redirects"  on public.redirects;

create policy "public read settings"   on public.settings   for select using (true);
create policy "public read authors"    on public.authors    for select using (true);
create policy "public read categories" on public.categories for select using (true);
create policy "public read posts"      on public.posts      for select using (status = 'published');
create policy "public read products"   on public.products   for select using (active);
create policy "public read redirects"  on public.redirects  for select using (active);
-- Writes happen only through the server with the service-role key (bypasses RLS).
