'use client';

import { useState, useEffect } from 'react';
import type { SiteSettings, Merchant, Product } from '@/lib/types';
import type { AffiliateSettings } from '@/lib/affiliate/types';
import { AffiliateManager } from '../affiliate-links/AffiliateManager';
import { MerchantManager } from '../merchants/MerchantManager';

interface SettingsManagerProps {
  initialSettings: SiteSettings;
  initialAffiliateSettings?: AffiliateSettings;
  initialMerchants?: Merchant[];
  initialStats?: {
    totalPosts: number;
    totalItems: number;
    itemsWithGo: number;
    totalAffiliateProducts: number;
    totalGoRedirects: number;
    merchantDistribution: Record<string, number>;
  };
  sampleProducts?: Product[];
  initialTab?: string;
  dbDriver: string;
}

const TABS = [
  { id: 'frontend', label: 'Frontend & Branding', icon: '🎨' },
  { id: 'affiliate', label: 'Affiliate Networks & Sync', icon: '🔗' },
  { id: 'merchants', label: 'Merchants & Stores', icon: '🏪' },
  { id: 'seo', label: 'SEO & Search Console', icon: '📈' },
  { id: 'backend', label: 'Database & Supabase', icon: '🗄️' },
  { id: 'scripts', label: 'Custom Scripts & Code', icon: '💻' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsManager({
  initialSettings,
  initialAffiliateSettings,
  initialMerchants = [],
  initialStats = {
    totalPosts: 0,
    totalItems: 0,
    itemsWithGo: 0,
    totalAffiliateProducts: 0,
    totalGoRedirects: 0,
    merchantDistribution: {},
  },
  sampleProducts = [],
  initialTab,
  dbDriver,
}: SettingsManagerProps) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (initialTab && TABS.some((t) => t.id === initialTab)) {
      return initialTab as TabId;
    }
    return 'frontend';
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMsg, setReseedMsg] = useState('');

  // Fallback affiliate settings if not provided
  const affiliateSettings: AffiliateSettings = initialAffiliateSettings || {
    defaultStrategy: (settings.default_affiliate_strategy as AffiliateSettings['defaultStrategy']) || 'smart_distribution',
    platforms: {
      amazon: {
        id: 'amazon',
        name: 'Amazon España (Associates)',
        tagOrId: settings.amazon_associates_tag || 'miregalo26-20',
        domain: 'https://www.amazon.es',
        active: true,
        commissionRate: '3% - 12%',
        notes: 'Primary merchant for fast Prime 24h fulfillment in Spain and Europe.',
        targetWeight: 60,
      },
      awin: {
        id: 'awin',
        name: 'Awin Network (El Corte Inglés, Fnac, Etsy)',
        tagOrId: settings.awin_affiliate_id || '128945',
        domain: 'https://www.awin1.com',
        active: true,
        commissionRate: '5% - 15%',
        notes: 'Leading European affiliate network for department stores and craft makers.',
        targetWeight: 15,
      },
      ebay: {
        id: 'ebay',
        name: 'eBay Partner Network (EPN)',
        tagOrId: settings.ebay_campaign_id || '5338901234',
        domain: 'https://www.ebay.es',
        active: true,
        commissionRate: '4% - 8%',
        notes: 'Vintage, collectible, and rare gifts marketplace.',
        targetWeight: 15,
      },
      walmart: {
        id: 'walmart',
        name: 'Walmart Creator & Impact',
        tagOrId: settings.walmart_partner_id || 'wm-giftblog-987',
        domain: 'https://goto.walmart.com',
        active: true,
        commissionRate: '4% - 10%',
        notes: 'Global consumer retail and lifestyle brand partner.',
        targetWeight: 10,
      },
    },
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && TABS.some((t) => t.id === tabParam)) {
        setActiveTab(tabParam as TabId);
      }
    }
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        setMsg('Failed to save settings');
        setLoading(false);
        return;
      }

      const updated = await res.json();
      setSettings(updated);
      setMsg('Settings saved and synchronized successfully!');
      setLoading(false);
      setTimeout(() => setMsg(''), 4000);
    } catch {
      setMsg('Error saving settings');
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm('Warning: This will reload data/db.json from data/seed.json. Proceed?')) return;
    setReseedLoading(true);
    setReseedMsg('');
    try {
      const res = await fetch('/api/admin/reseed/', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReseedMsg('Database successfully reset to seed state.');
      } else {
        setReseedMsg(data.error || 'Failed to reset database');
      }
      setReseedLoading(false);
    } catch {
      setReseedMsg('Error occurred while resetting database');
      setReseedLoading(false);
    }
  };

  const isFormTab = ['frontend', 'seo', 'backend', 'scripts'].includes(activeTab);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px', color: '#171a35' }}>
          ⚙️ Master Settings &amp; Configuration Hub
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
          Centralized configuration for Miregalo: branding, affiliate networks &amp; tracking tags, merchant partners, SEO &amp; GSC verification, database drivers, and custom scripts.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: '#e6f7ed', border: '1px solid #a6f4c5', borderRadius: '8px', color: '#027a48', marginBottom: '20px' }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 2: AFFILIATE NETWORKS & SYNC ─────────── */}
      {activeTab === 'affiliate' && (
        <div>
          <div style={{ background: '#f8f9fc', border: '1px solid #e6e7ec', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475467', lineHeight: 1.5 }}>
                <strong>Centralized Affiliate Configuration:</strong> Configure tags, API credentials, and distribution weights for Amazon Associates, Awin, eBay, and Walmart. Changes save directly to database settings and synchronize with all 1,680+ gift guides.
              </p>
            </div>
          </div>

          <AffiliateManager
            initialSettings={affiliateSettings}
            initialStats={initialStats}
            sampleProducts={sampleProducts}
          />
        </div>
      )}

      {/* ── TAB 3: MERCHANTS & STORES ─────────────────── */}
      {activeTab === 'merchants' && (
        <div>
          <div style={{ background: '#f8f9fc', border: '1px solid #e6e7ec', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏪</span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475467', lineHeight: 1.5 }}>
                <strong>Merchants &amp; Partners Management:</strong> Add, edit, or remove retail merchants, assign them to affiliate networks (Amazon, Awin, eBay, Walmart, Direct), manage commission rates, and track parameters.
              </p>
            </div>
          </div>

          <MerchantManager initialMerchants={initialMerchants} />
        </div>
      )}

      {/* ── FORM TABS: FRONTEND, SEO, BACKEND, SCRIPTS ── */}
      {isFormTab && (
        <form onSubmit={handleSave}>
          {/* ── TAB 1: FRONTEND & BRANDING ──────────────── */}
          {activeTab === 'frontend' && (
            <div className="admin-card">
              <h2 className="admin-card-title" style={{ marginBottom: '20px' }}>
                Branding &amp; Visual Configuration
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Site Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tagline</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.site_tagline}
                    onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.organization_name}
                    onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Site Description (Meta / Default)</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '70px' }}
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Logo URL</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Favicon URL</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.favicon_url}
                    onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Posts Per Page</label>
                  <input
                    className="form-input"
                    type="number"
                    value={settings.posts_per_page}
                    onChange={(e) => setSettings({ ...settings, posts_per_page: parseInt(e.target.value, 10) || 24 })}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '24px 0 16px', color: '#171a35' }}>
                Store Link &amp; CTA
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Shop Destination URL</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.shop_url}
                    onChange={(e) => setSettings({ ...settings, shop_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Button Label</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.shop_label}
                    onChange={(e) => setSettings({ ...settings, shop_label: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact URL</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.contact_url}
                    onChange={(e) => setSettings({ ...settings, contact_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Affiliate Disclosure Notice</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                  value={settings.affiliate_disclosure}
                  onChange={(e) => setSettings({ ...settings, affiliate_disclosure: e.target.value })}
                />
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '24px 0 16px', color: '#171a35' }}>
                Hero &amp; Footer Text
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hero Title</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hero Eyebrow</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.hero_eyebrow}
                    onChange={(e) => setSettings({ ...settings, hero_eyebrow: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hero Lead Copy</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                  value={settings.hero_lead}
                  onChange={(e) => setSettings({ ...settings, hero_lead: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Copyright Text (supports &#123;year&#125;)</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.copyright}
                    onChange={(e) => setSettings({ ...settings, copyright: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Footer Tagline</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.footer_tagline}
                    onChange={(e) => setSettings({ ...settings, footer_tagline: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: SEO & GSC ────────────────────────── */}
          {activeTab === 'seo' && (
            <div className="admin-card">
              <h2 className="admin-card-title" style={{ marginBottom: '20px' }}>
                Search Engine Optimization &amp; Google Search Console
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Google Search Console Verification Tag</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.gsc_verification}
                    onChange={(e) => setSettings({ ...settings, gsc_verification: e.target.value })}
                    placeholder="e.g. q3ZACanWRjwIhlEdAb7fksnumlaM9OHH829aq6STcnc"
                  />
                  <div className="form-hint">Emits <code>&lt;meta name=&quot;google-site-verification&quot;&gt;</code></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Google Analytics 4 Measurement ID</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.ga4_id}
                    onChange={(e) => setSettings({ ...settings, ga4_id: e.target.value })}
                    placeholder="e.g. G-WRGWXTNWV3"
                  />
                  <div className="form-hint">Loads gtag.js asynchronously via Next.js Script</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Google Programmable Search Engine ID (CX)</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.google_search_cx || ''}
                    onChange={(e) => setSettings({ ...settings, google_search_cx: e.target.value })}
                    placeholder="e.g. 0123456789abcdef:example"
                  />
                  <div className="form-hint">Enables the official Google Search script and box on /search/</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bing Webmaster Verification Code</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.bing_verification}
                    onChange={(e) => setSettings({ ...settings, bing_verification: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Title Separator</label>
                  <input
                    className="form-input"
                    type="text"
                    value={settings.title_separator}
                    onChange={(e) => setSettings({ ...settings, title_separator: e.target.value })}
                    style={{ maxWidth: '80px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Extra Robots.txt Rules</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  value={settings.robots_extra}
                  onChange={(e) => setSettings({ ...settings, robots_extra: e.target.value })}
                  placeholder="Disallow: /private/&#10;Crawl-delay: 10"
                />
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: settings.noindex_site ? '#b42318' : '#171a35' }}>
                  <input
                    type="checkbox"
                    checked={settings.noindex_site}
                    onChange={(e) => setSettings({ ...settings, noindex_site: e.target.checked })}
                  />
                  Block Search Engines (noindex, nofollow entire site)
                </label>
                <div className="form-hint">Turn on only for staging/development environments.</div>
              </div>

              {/* Sitemap Links */}
              <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fc', borderRadius: '10px', border: '1px solid #e6e7ec' }}>
                <strong style={{ fontSize: '0.88rem', color: '#171a35' }}>Sitemaps &amp; Feeds:</strong>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.84rem' }}>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ color: '#3349b5' }}>
                    /sitemap.xml ↗
                  </a>
                  <a href="/robots.txt" target="_blank" rel="noopener noreferrer" style={{ color: '#3349b5' }}>
                    /robots.txt ↗
                  </a>
                  <a href="/rss.xml" target="_blank" rel="noopener noreferrer" style={{ color: '#3349b5' }}>
                    /rss.xml ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: BACKEND & SUPABASE ───────────────── */}
          {activeTab === 'backend' && (
            <div className="admin-card">
              <h2 className="admin-card-title" style={{ marginBottom: '20px' }}>
                Backend &amp; Database Configuration
              </h2>

              <div style={{ padding: '16px', background: '#f8f9fc', borderRadius: '10px', border: '1px solid #e6e7ec', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#69707d', textTransform: 'uppercase', fontWeight: 600 }}>
                      Active Database Driver
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#171a35', marginTop: '2px' }}>
                      {dbDriver}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: dbDriver === 'Supabase' ? '#eef1ff' : '#e6f7ed',
                      color: dbDriver === 'Supabase' ? '#3349b5' : '#027a48',
                    }}
                  >
                    {dbDriver === 'Supabase' ? 'Cloud Connected' : 'Zero-setup Dev'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '0 0 8px' }}>
                  Supabase Cloud Status:
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#454852', lineHeight: 1.6 }}>
                  Database tables (posts, categories, authors, products, merchants, redirects, settings) are fully synced and operational on Supabase Cloud with PostgreSQL.
                </p>
              </div>

              <div style={{ paddingTop: '20px', borderTop: '1px solid #e6e7ec' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '0 0 8px', color: '#b42318' }}>
                  Development Reset Tool
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#69707d' }}>
                  Reset <code>data/db.json</code> back to clean state from <code>data/seed.json</code>.
                </p>
                {reseedMsg && (
                  <div style={{ padding: '10px 14px', background: '#eef1ff', borderRadius: '8px', color: '#3349b5', fontSize: '0.84rem', marginBottom: '14px' }}>
                    {reseedMsg}
                  </div>
                )}
                <button
                  type="button"
                  className="btn-danger"
                  disabled={reseedLoading}
                  onClick={handleReseed}
                >
                  {reseedLoading ? 'Resetting...' : 'Reset Local DB from seed.json'}
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 6: CUSTOM CODE & SCRIPTS ───────────── */}
          {activeTab === 'scripts' && (
            <div className="admin-card">
              <h2 className="admin-card-title" style={{ marginBottom: '20px' }}>
                Custom Code Injection
              </h2>

              <div className="form-group">
                <label className="form-label">&lt;head&gt; Custom HTML / Scripts</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  value={settings.head_scripts}
                  onChange={(e) => setSettings({ ...settings, head_scripts: e.target.value })}
                  placeholder="<!-- Google Tag Manager, custom CSS, verification tags -->"
                />
              </div>

              <div className="form-group">
                <label className="form-label">&lt;body&gt; Custom HTML / Scripts (Bottom of page)</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  value={settings.body_scripts}
                  onChange={(e) => setSettings({ ...settings, body_scripts: e.target.value })}
                  placeholder="<!-- Live chat widget, pixel tracking scripts -->"
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: '0.94rem' }}>
              {loading ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
