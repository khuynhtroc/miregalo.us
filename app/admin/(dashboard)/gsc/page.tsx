import { db } from '@/lib/db';
import { GscAnalyticsViewer } from './GscAnalyticsViewer';
import type { GscSummaryStats } from '@/lib/gsc/types';

export default async function AdminGscPage() {
  const [metricsRes, oppsRes] = await Promise.all([
    db.find('gsc_metrics', {
      order: [{ field: 'impressions', asc: false }],
      limit: 100,
    }),
    db.find('gsc_opportunities', {
      order: [{ field: 'potential_clicks', asc: false }],
    }),
  ]);

  const metrics = metricsRes.rows;
  const opportunities = oppsRes.rows;

  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPos =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.position, 0) / metrics.length
      : 0;

  const summary: GscSummaryStats = {
    totalClicks,
    totalImpressions,
    averageCtr: +avgCtr.toFixed(2),
    averagePosition: +avgPos.toFixed(1),
    topQueriesCount: metricsRes.total,
    strikingDistanceCount: opportunities.filter((o) => o.type === 'striking_distance').length,
    lowCtrCount: opportunities.filter((o) => o.type === 'low_ctr').length,
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171a35', margin: '0 0 6px' }}>
          Google Search Console Analytics &amp; Opportunities (Phase 8)
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
          Real-time SERP telemetry, striking distance keywords detection, and CTR gap opportunity intelligence.
        </p>
      </div>

      <GscAnalyticsViewer
        initialSummary={summary}
        initialMetrics={metrics}
        initialOpportunities={opportunities}
      />
    </div>
  );
}
