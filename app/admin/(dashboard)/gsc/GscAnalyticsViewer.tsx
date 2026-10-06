'use client';

import { useState } from 'react';
import type { GscMetric, GscOpportunity } from '@/lib/types';
import type { GscSummaryStats } from '@/lib/gsc/types';

interface GscAnalyticsViewerProps {
  initialSummary: GscSummaryStats;
  initialMetrics: GscMetric[];
  initialOpportunities: GscOpportunity[];
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function GscAnalyticsViewer({
  initialSummary,
  initialMetrics,
  initialOpportunities,
}: GscAnalyticsViewerProps) {
  const [summary, setSummary] = useState<GscSummaryStats>(initialSummary);
  const [metrics, setMetrics] = useState<GscMetric[]>(initialMetrics);
  const [opportunities, setOpportunities] = useState<GscOpportunity[]>(initialOpportunities);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'queries'>('opportunities');
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/gsc/sync/', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Sync complete! Ingested ${data.importedRows} query metrics and identified ${data.opportunitiesDetected} SEO opportunities.`);
        // Reload data
        const getRes = await fetch('/api/admin/gsc/');
        const fresh = await getRes.json();
        setSummary(fresh.summary);
        setMetrics(fresh.metrics || []);
        setOpportunities(fresh.opportunities || []);
      } else {
        setMsg(data.error || 'Failed to sync GSC data');
      }
    } catch {
      setMsg('Error triggering GSC sync');
    } finally {
      setSyncing(false);
    }
  };

  const filteredOpps = opportunities.filter((o) =>
    o.query.toLowerCase().includes(q.toLowerCase()) ||
    o.page.toLowerCase().includes(q.toLowerCase())
  );

  const filteredMetrics = metrics.filter((m) =>
    m.query.toLowerCase().includes(q.toLowerCase()) ||
    m.page.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      {/* ── Toolbar & Sync Button ─────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('opportunities')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: '1px solid #cbd5e1',
              background: activeTab === 'opportunities' ? '#0284c7' : '#ffffff',
              color: activeTab === 'opportunities' ? '#ffffff' : '#334155',
              cursor: 'pointer',
            }}
          >
            🎯 SEO Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: '1px solid #cbd5e1',
              background: activeTab === 'queries' ? '#0284c7' : '#ffffff',
              color: activeTab === 'queries' ? '#ffffff' : '#334155',
              cursor: 'pointer',
            }}
          >
            📊 Query Performance ({metrics.length})
          </button>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>{syncing ? '🔄 Syncing...' : '🔄 Sync Search Console Data'}</span>
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '24px' }}>
          {msg}
        </div>
      )}

      {/* ── Metric Cards ──────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Clicks (28d)</span>
          <span className="stat-val" suppressHydrationWarning>{formatNumber(summary.totalClicks)}</span>
          <span className="stat-desc">Organic Google Search</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Impressions</span>
          <span className="stat-val" suppressHydrationWarning>{formatNumber(summary.totalImpressions)}</span>
          <span className="stat-desc">SERP Appearances</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Average CTR</span>
          <span className="stat-val">{summary.averageCtr}%</span>
          <span className="stat-desc">Click-through rate</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Average Position</span>
          <span className="stat-val">#{summary.averagePosition}</span>
          <span className="stat-desc">Overall SERP Rank</span>
        </div>

        <div className="stat-card" style={{ borderColor: '#fed7aa', background: '#fffbeb' }}>
          <span className="stat-label" style={{ color: '#c2410c' }}>Striking Distance</span>
          <span className="stat-val" style={{ color: '#c2410c' }}>{summary.strikingDistanceCount}</span>
          <span className="stat-desc">Positions 8–20 (High Opportunity)</span>
        </div>

        <div className="stat-card" style={{ borderColor: '#fbcfe8', background: '#fdf2f8' }}>
          <span className="stat-label" style={{ color: '#be185d' }}>Low CTR Alerts</span>
          <span className="stat-val" style={{ color: '#be185d' }}>{summary.lowCtrCount}</span>
          <span className="stat-desc">Needs Title/Meta Optimization</span>
        </div>
      </div>

      {/* ── Search Filter ─────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="search"
          placeholder="Filter by keyword or landing page path..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            minWidth: '320px',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {/* ── TAB 1: SEO OPPORTUNITIES ───────────── */}
      {activeTab === 'opportunities' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Search Query</th>
                <th>Landing Page</th>
                <th>Pos</th>
                <th>Actual CTR</th>
                <th>Potential Gain</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpps.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No opportunities detected. Click &quot;Sync Search Console Data&quot; to analyze telemetry.
                  </td>
                </tr>
              ) : (
                filteredOpps.map((opp) => (
                  <tr key={opp.id}>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: opp.type === 'striking_distance' ? '#fff7ed' : '#fdf2f8',
                          color: opp.type === 'striking_distance' ? '#c2410c' : '#be185d',
                          border: opp.type === 'striking_distance' ? '1px solid #fdba74' : '1px solid #f9a8d4',
                        }}
                      >
                        {opp.type === 'striking_distance' ? 'STRIKING DISTANCE' : 'LOW CTR ALERT'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{opp.query}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }} suppressHydrationWarning>
                        {formatNumber(opp.impressions)} impressions • {formatNumber(opp.clicks)} clicks
                      </div>
                    </td>
                    <td>
                      <a
                        href={opp.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0284c7', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.82rem' }}
                      >
                        {opp.page} ↗
                      </a>
                    </td>
                    <td style={{ fontWeight: 700 }}>#{opp.current_position}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {(opp.actual_ctr * 100).toFixed(1)}%{' '}
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        (exp. {(opp.expected_ctr * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.88rem' }}>
                        +{opp.potential_clicks} clicks/mo
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#334155', maxWidth: '320px' }}>
                      {opp.action_recommended}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 2: QUERY PERFORMANCE ─────────── */}
      {activeTab === 'queries' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Search Query</th>
                <th>Landing URL</th>
                <th>Clicks</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>Average Position</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No query performance records found.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{m.query}</strong>
                    </td>
                    <td>
                      <a
                        href={m.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0284c7', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.82rem' }}
                      >
                        {m.page} ↗
                      </a>
                    </td>
                    <td style={{ fontWeight: 600 }} suppressHydrationWarning>{formatNumber(m.clicks)}</td>
                    <td suppressHydrationWarning>{formatNumber(m.impressions)}</td>
                    <td>{(m.ctr * 100).toFixed(1)}%</td>
                    <td style={{ fontWeight: 600 }}>#{m.position.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
