-- PROPOSED DATA UPDATE — REVIEW BEFORE RUNNING. NOT executed by this PR.
-- Target: miregalo.us Supabase (public.products, public.posts.items)
-- Goal: US market — amazon.com links with US Associates tag, neutral merchant labels, hide EUR placeholder prices.
-- Recommended: take a backup first:  create table products_backup_20261014 as table products;
--                                      create table posts_backup_20261014 as table posts;
begin;

-- 1) Specific Amazon links on any marketplace (.es/.co.uk/.in/.com, incl. Awin-wrapped) -> amazon.com/dp/ASIN + our tag
update products
set url = 'https://www.amazon.com/dp/' || upper(substring(replace(url,'%2F','/') from '/(?:dp|gp/product)/([A-Za-z0-9]{10})')) || '/?tag=miregalo26-20',
    updated_at = now()
where replace(url,'%2F','/') ~* 'amazon\.[a-z.]+.*/(dp|gp/product)/[A-Za-z0-9]{10}';

-- 2) Verified exact matches for former amazon.es search links
update products set url = 'https://www.amazon.com/dp/B084GY57Y5/?tag=miregalo26-20', updated_at = now()
where name = 'Cafetera de Cápsulas Nespresso Vertuo Next' and url ~* 'amazon\.es/s\?';
update products set url = 'https://www.amazon.com/dp/B01CIHHVXQ/?tag=miregalo26-20', updated_at = now()
where name = 'Escritorio de actividades VTech Touch and Learn Deluxe' and url ~* 'amazon\.es/s\?';

-- 3) Remaining amazon.es searches and El Corte Inglés (Awin) links -> amazon.com search by product name
update products
set url = 'https://www.amazon.com/s?k=' || replace(left(name,70),' ','+') || '&tag=miregalo26-20', updated_at = now()
where url ~* 'amazon\.es/' or url ~* 'elcorteingles';

-- 4) eBay Spain -> eBay US
update products set url = replace(url,'www.ebay.es','www.ebay.com'), updated_at = now() where url ~* 'ebay\.es';

-- 5) Merchant labels
update products set merchant = 'Amazon'  where url ~* 'amazon\.com';
update products set merchant = 'Etsy'    where url ~* 'etsy';
update products set merchant = 'eBay'    where url ~* 'ebay\.';
update products set merchant = 'Walmart' where url ~* 'walmart';
update products set merchant = 'Amazon'  where merchant ~* 'españa|corte ingl';

-- 6) Hide EUR placeholder prices (never converted). UI shows "Ver precio en Amazon".
update products set price = '', currency = 'USD', updated_at = now()
where currency = 'EUR' or price ~ '€';

-- 7) Same for gift-guide items embedded in posts.items
update posts p
set items = (
  select jsonb_agg(
    case when (it->>'price') ~ '€' then jsonb_set(it, '{price}', '""') else it end
    || case when (it->>'merchant') ~* 'españa|corte ingl' then jsonb_build_object('merchant','Amazon') else '{}'::jsonb end
  ) from jsonb_array_elements(p.items) it
), updated_at = now()
where jsonb_typeof(p.items) = 'array' and p.items::text ~* '€|españa|corte ingl';

-- 8) Default affiliate settings (if stored in settings table)
update settings set value = jsonb_set(value, '{amazon_associates_tag}', '"miregalo26-20"')
where key = 'site' and value ? 'amazon_associates_tag';

commit;
-- NOTE: loveable.us / loveable.ai product links (~9.7k) are left as-is; the /go router already sends them
-- to an amazon.com search. They should be replaced with real Etsy/Amazon items in a later pass.
