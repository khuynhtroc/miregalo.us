'use client';

import { useState } from 'react';
import type { AffiliateSettings, AffiliateSyncResult } from '@/lib/affiliate/types';
import type { Product } from '@/lib/types';

interface AffiliateManagerProps {
  initialSettings: AffiliateSettings;
  initialStats: {
    totalPosts: number;
    totalItems: number;
    itemsWithGo: number;
    totalAffiliateProducts: number;
    totalGoRedirects: number;
    merchantDistribution: Record<string, number>;
  };
  sampleProducts: Product[];
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function AffiliateManager({
  initialSettings,
  initialStats,
  sampleProducts,
}: AffiliateManagerProps) {
  const [settings, setSettings] = useState<AffiliateSettings>(initialSettings);
  const [stats, setStats] = useState(initialStats);
  const [selectedStrategy, setSelectedStrategy] = useState<string>(
    settings.defaultStrategy || 'smart_distribution'
  );
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<AffiliateSyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('all');

  // Platform edit state
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [tempTag, setTempTag] = useState('');

  const handleStartEditPlatform = (platformId: string) => {
    setEditingPlatform(platformId);
    setTempTag(settings.platforms[platformId]?.tagOrId || '');
  };

  const handleSavePlatform = async (platformId: string) => {
    setErrorMsg('');
    try {
      const updatedPlatforms = {
        ...settings.platforms,
        [platformId]: {
          ...settings.platforms[platformId],
          tagOrId: tempTag.trim(),
        },
      };

      const res = await fetch('/api/admin/affiliate-platforms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: updatedPlatforms }),
      });

      if (!res.ok) throw new Error('Failed to update platform settings');

      const data = await res.json();
      setSettings(data.settings);
      setEditingPlatform(null);
      setSuccessMsg(`Platform ${platformId.toUpperCase()} settings saved successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving platform');
    }
  };

  const handleRunSync = async () => {
    setSyncing(true);
    setErrorMsg('');
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/affiliate-platforms/sync/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: selectedStrategy }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to synchronize items');
      }

      const result: AffiliateSyncResult = await res.json();
      setSyncResult(result);

      // Refresh stats
      const statsRes = await fetch('/api/admin/affiliate-platforms/');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setSettings(statsData.settings);
      }

      setSuccessMsg(
        `Synchronized ${formatNumber(result.totalItemsSynced)} items across ${formatNumber(result.totalPostsProcessed)} articles successfully!`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Synchronization failed');
    } finally {
      setSyncing(false);
    }
  };

  const platformsList = [
    {
      id: 'amazon',
      badge: 'Amazon Associates',
      icon: '📦',
      color: '#ff9900',
      bgColor: '#fff8f0',
      borderColor: '#fed7aa',
      desc: 'Prime 24h fulfillment in Spain and Western Europe. Tag parameter: tag=...',
    },
    {
      id: 'awin',
      badge: 'Awin Network',
      icon: '🌐',
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      desc: 'European retail leaders including El Corte Inglés, Fnac, and Etsy artisans.',
    },
    {
      id: 'ebay',
      badge: 'eBay Partner Network',
      icon: '🏷️',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      desc: 'Vintage, collectible, and unique personalized gifts. Campaign ID parameter: campid=...',
    },
    {
      id: 'walmart',
      badge: 'Walmart Creator & Impact',
      icon: '🛒',
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
      desc: 'High-volume international consumer electronics and lifestyle gifts.',
    },
  ];

  const filteredProducts = sampleProducts.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMerchant =
      filterMerchant === 'all' ||
      (filterMerchant === 'amazon' && p.merchant.toLowerCase().includes('amazon')) ||
      (filterMerchant === 'awin' && (p.merchant.toLowerCase().includes('awin') || p.merchant.toLowerCase().includes('corte') || p.merchant.toLowerCase().includes('etsy'))) ||
      (filterMerchant === 'ebay' && p.merchant.toLowerCase().includes('ebay')) ||
      (filterMerchant === 'walmart' && p.merchant.toLowerCase().includes('walmart'));

    return matchesSearch && matchesMerchant;
  });

  return (
    <div>
      {/* 1. TOP STATS BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '0.82rem', color: '#667085', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Items Managed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#101828', marginTop: '4px' }} suppressHydrationWarning>
            {formatNumber(stats.totalItems)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#12b76a', marginTop: '4px' }} suppressHydrationWarning>
            Across {formatNumber(stats.totalPosts)} gift guides
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '0.82rem', color: '#667085', fontWeight: 600, textTransform: 'uppercase' }}>
            Outbound Tracking Links
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#101828', marginTop: '4px' }} suppressHydrationWarning>
            {formatNumber(stats.itemsWithGo)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#667085', marginTop: '4px' }}>
            Routed via <code>/go/[slug]/</code> redirects
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '0.82rem', color: '#667085', fontWeight: 600, textTransform: 'uppercase' }}>
            Connected Platforms
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#101828', marginTop: '4px' }}>
            4 Networks
          </div>
          <div style={{ fontSize: '0.8rem', color: '#667085', marginTop: '4px' }}>
            Amazon, Awin, eBay, Walmart
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '0.82rem', color: '#667085', fontWeight: 600, textTransform: 'uppercase' }}>
            Last Sync Status
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#101828', marginTop: '8px' }} suppressHydrationWarning>
            {settings.lastSyncedAt
              ? new Date(settings.lastSyncedAt).toLocaleTimeString() + ' (OK)'
              : 'Pending First Sync'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#667085', marginTop: '4px' }} suppressHydrationWarning>
            {settings.lastSyncedItemsCount
              ? `${formatNumber(settings.lastSyncedItemsCount)} items synchronized`
              : 'Click Sync Below'}
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div
          style={{
            background: '#fef3f2',
            border: '1px solid #fecdca',
            color: '#b42318',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          ❌ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: '#ecfdf3',
            border: '1px solid #a6f4c5',
            color: '#027a48',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* 2. PLATFORM CARDS */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#101828', marginBottom: '16px' }}>
        Affiliate Networks Configuration
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {platformsList.map((p) => {
          const cfg = settings.platforms[p.id];
          const isEditing = editingPlatform === p.id;

          return (
            <div
              key={p.id}
              style={{
                background: '#fff',
                border: `1px solid ${p.borderColor}`,
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                  <span
                    style={{
                      background: p.bgColor,
                      color: p.color,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${p.borderColor}`,
                    }}
                  >
                    {p.badge}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#101828', marginTop: '12px' }}>
                  {cfg?.name || p.badge}
                </div>

                <p style={{ fontSize: '0.84rem', color: '#667085', margin: '8px 0 12px 0', minHeight: '38px' }}>
                  {p.desc}
                </p>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    {p.id === 'amazon'
                      ? 'ASSOCIATE TAG'
                      : p.id === 'awin'
                      ? 'PUBLISHER ID'
                      : p.id === 'ebay'
                      ? 'CAMPAIGN ID (CAMPID)'
                      : 'PUBLISHER / SUBID'}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={tempTag}
                        onChange={(e) => setTempTag(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                        }}
                      />
                      <button
                        onClick={() => handleSavePlatform(p.id)}
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPlatform(null)}
                        style={{
                          background: '#e2e8f0',
                          border: 'none',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '4px',
                      }}
                    >
                      <code style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>
                        {cfg?.tagOrId || 'Not Configured'}
                      </code>
                      <button
                        onClick={() => handleStartEditPlatform(p.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>Commission: <strong>{cfg?.commissionRate || 'Standard'}</strong></span>
                  <span>Target Ratio: <strong>{cfg?.targetWeight || 25}%</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. GLOBAL SYNCHRONIZATION CONTROLLER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '12px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '36px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Global Affiliate Synchronizer
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0', maxWidth: '650px' }}>
              One-click batch synchronization that injects configured affiliate tracking tags into all product items across all 1,680+ articles and generates permanent <code>/go/[slug]/</code> click tracking redirects.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              style={{
                background: '#334155',
                color: '#fff',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="smart_distribution">Smart Multi-Platform (60% Amazon, 15% Awin, 15% eBay, 10% Walmart)</option>
              <option value="amazon_only">100% Amazon España Primary</option>
              <option value="awin_only">100% Awin Network</option>
              <option value="ebay_only">100% eBay Partner Network</option>
              <option value="walmart_only">100% Walmart</option>
            </select>

            <button
              onClick={handleRunSync}
              disabled={syncing}
              style={{
                background: syncing ? '#64748b' : '#38bdf8',
                color: syncing ? '#cbd5e1' : '#0f172a',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: syncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {syncing ? '⏳ Syncing All Items...' : '🚀 Synchronize All Post Items Now'}
            </button>
          </div>
        </div>

        {syncResult && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ARTICLES UPDATED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }} suppressHydrationWarning>{formatNumber(syncResult.totalPostsProcessed)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TOTAL ITEMS SYNCED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }} suppressHydrationWarning>{formatNumber(syncResult.totalItemsSynced)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AMAZON ITEMS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }} suppressHydrationWarning>{formatNumber(syncResult.platformCounts.amazon)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AWIN ITEMS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }} suppressHydrationWarning>{formatNumber(syncResult.platformCounts.awin)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>EBAY / WALMART ITEMS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }} suppressHydrationWarning>
                {formatNumber(syncResult.platformCounts.ebay + syncResult.platformCounts.walmart)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. AFFILIATE ITEMS DIRECTORY & SEARCH TABLE */}
      <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: '10px', overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #eaecf0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#101828', margin: 0 }}>
              Sample Affiliate Items & Outbound Tracking Links
            </h3>
            <p style={{ color: '#667085', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
              Preview items in posts, their internal <code>/go/</code> redirect paths, and destination merchant partner.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search product name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d0d5dd',
                borderRadius: '6px',
                fontSize: '0.86rem',
                minWidth: '220px',
              }}
            />

            <select
              value={filterMerchant}
              onChange={(e) => setFilterMerchant(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d0d5dd',
                borderRadius: '6px',
                fontSize: '0.86rem',
                fontWeight: 500,
              }}
            >
              <option value="all">All Merchants</option>
              <option value="amazon">Amazon España</option>
              <option value="awin">Awin / El Corte Inglés</option>
              <option value="ebay">eBay Partner Network</option>
              <option value="walmart">Walmart</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', color: '#475467', borderBottom: '1px solid #eaecf0' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Product Title</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Merchant Platform</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Internal Outbound Link</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#98a2b3' }}>
                    No products matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #f2f4f7' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#101828' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt=""
                            style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : null}
                        <div>
                          <div>{prod.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#98a2b3' }}>ID: {prod.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: prod.merchant.includes('Amazon')
                            ? '#fff8f0'
                            : prod.merchant.includes('Awin') || prod.merchant.includes('Corte')
                            ? '#ecfdf5'
                            : '#eff6ff',
                          color: prod.merchant.includes('Amazon')
                            ? '#b45309'
                            : prod.merchant.includes('Awin') || prod.merchant.includes('Corte')
                            ? '#047857'
                            : '#1d4ed8',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        {prod.merchant}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <code style={{ fontSize: '0.82rem', color: '#0f172a' }}>/go/{prod.slug}/</code>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#101828' }}>
                      {prod.price || '29,99 €'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: '#ecfdf3',
                          color: '#027a48',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        ● Active
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <a
                        href={`/go/${prod.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.82rem',
                          color: '#2563eb',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Test Redirect ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
