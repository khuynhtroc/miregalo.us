import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const miregaloSettings = {
  site_name: 'Miregalo',
  site_tagline: 'Ideas de regalos significativas para cada persona, relación y ocasión.',
  site_description: 'Guías y sugerencias de regalos pensadas para sorprender a quien más quieres en cualquier momento especial.',
  organization_name: 'Miregalo',
  organization_url: 'https://www.miregalo.us',
  logo_url: '/images/miregalo-logo.png',
  logo_fullsize_url: '/images/miregalo-logo-fullsize.png',
  favicon_url: '/favicon.png',
  default_og_image: '/images/miregalo-logo-fullsize.png',
  locale: 'es',
  title_separator: '|',
  shop_url: '/regalos/',
  shop_label: 'Explorar Regalos',
  contact_url: '/contacto/',
  copyright: '© 2026 Miregalo. Todos los derechos reservados.',
  footer_tagline: 'Ideas desde el corazón, hechas para compartir.',
  footer_about: 'Miregalo es tu portal de referencia para encontrar regalos originales, personalizados y emotivos para cada ocasión especial.',
  hero_eyebrow: 'Ideas con significado, hechas personales',
  hero_title: 'Encuentra un regalo que recordarán siempre',
  hero_lead: 'Explora guías detalladas para cada persona, relación y ocasión, y transforma la idea perfecta en un recuerdo inolvidable.',
  search_placeholder: 'Buscar ideas de regalos, personas u ocasiones...',
  cta_eyebrow: 'Hazlo personal',
  cta_title: '¿Encontraste la idea perfecta?',
  cta_text: 'Convierte tu inspiración en un regalo personalizado creado especialmente para ellos.',
  affiliate_disclosure: 'Este artículo contiene recomendaciones editoriales independientes. Si compras a través de nuestros enlaces, podemos recibir una pequeña comisión sin coste adicional para ti. En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.',
  posts_per_page: 24,
  ga4_id: 'G-WRGWXTNWV3',
  gtm_id: 'GTM-NLLPRRXN',
  gsc_verification: '',
  gsc_property: '',
  bing_verification: '',
  pinterest_verification: 'aa17ebb2f5874bb384abd7511116e441',
  pinterest_tag_id: '',
  ahrefs_key: 'TxPIlr+hGAIJpqeul2OREw',
  head_scripts: '',
  body_scripts: '',
  robots_extra: '',
  noindex_site: false,
  google_search_cx: '',
  amazon_associates_tag: 'miregalo26-20',
  awin_affiliate_id: '128945',
  ebay_campaign_id: '5338901234',
  walmart_partner_id: 'wm-giftblog-987',
  default_affiliate_strategy: 'smart_distribution',
  adsense_enabled: true,
  adsense_client_id: 'ca-pub-2959580292222970',
  adsense_slot_in_article: '',
  adsense_slot_in_feed: '',
  adsense_slot_sidebar: '',
  adsense_slot_multiplex: '',
};

async function restore() {
  console.log('1. Overwriting Supabase site setting with pure Miregalo data...');
  const { error: sErr } = await sb
    .from('settings')
    .upsert({ key: 'site', value: miregaloSettings, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (sErr) {
    console.error('Error updating site settings in Supabase:', sErr);
  } else {
    console.log('✓ Successfully restored Miregalo site settings in Supabase!');
  }

  console.log('2. Deleting foreign story_reports key from settings table...');
  const { error: delErr } = await sb.from('settings').delete().eq('key', 'story_reports');
  if (delErr) {
    console.warn('Warning deleting story_reports:', delErr.message);
  } else {
    console.log('✓ Removed story_reports from Supabase settings.');
  }

  // Also update local db.json
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!db.settings) db.settings = {};
    db.settings.site = miregaloSettings;
    delete db.settings.story_reports;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 1), 'utf8');
    console.log('✓ Updated data/db.json with clean Miregalo settings.');
  }
}

restore().catch(console.error);
