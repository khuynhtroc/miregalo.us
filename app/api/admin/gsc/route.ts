import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { GscMetric, GscOpportunity } from '@/lib/types';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPos =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.position, 0) / metrics.length
      : 0;

  const strikingDistance = opportunities.filter((o) => o.type === 'striking_distance');
  const lowCtr = opportunities.filter((o) => o.type === 'low_ctr');

  return NextResponse.json({
    summary: {
      totalClicks,
      totalImpressions,
      averageCtr: +(avgCtr * 100).toFixed(2),
      averagePosition: +avgPos.toFixed(1),
      totalQueriesCount: metricsRes.total,
      strikingDistanceCount: strikingDistance.length,
      lowCtrCount: lowCtr.length,
    },
    metrics,
    opportunities,
  });
}
