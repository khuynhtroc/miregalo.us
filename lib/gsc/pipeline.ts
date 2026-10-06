import { db } from '@/lib/db';
import type { GscMetric } from '@/lib/types';
import type { GscSyncOptions, GscSyncResult } from './types';
import { getGscAccessToken, isGscConfigured } from './auth';
import { generateSeoOpportunities } from './opportunities';

/**
 * Ingestion pipeline to import Search Analytics metrics from Google Search Console.
 */
export async function syncGscData(options: GscSyncOptions = {}): Promise<GscSyncResult> {
  const startTime = Date.now();
  const token = await getGscAccessToken();
  const isMock = !token || !isGscConfigured();

  const now = new Date();
  const endDate = options.endDate || now.toISOString().split('T')[0];
  const startDate =
    options.startDate ||
    new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let rawMetrics: GscMetric[] = [];

  if (isMock) {
    // Generate high-fidelity seed telemetry for local development
    rawMetrics = await generateMockGscTelemetry();
  } else {
    // Live Search Console API call
    const siteUrl = options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: options.rowLimit || 500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Search Console API error: ${errText}`);
    }

    const data = await res.json();
    const rows = data.rows || [];

    rawMetrics = rows.map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }, i: number) => ({
      id: `gsc-${Date.now().toString().slice(-4)}-${i}`,
      query: r.keys[0] || '',
      page: r.keys[1] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
      date: endDate,
      created_at: new Date().toISOString(),
    }));
  }

  // Save metrics into database in a single batch operation
  if (db.upsertBatch) {
    await db.upsertBatch('gsc_metrics', rawMetrics, ['query', 'page']);
  } else {
    for (const metric of rawMetrics) {
      const existing = await db.findOne('gsc_metrics', { query: metric.query, page: metric.page });
      if (existing) {
        await db.update('gsc_metrics', existing.id, metric);
      } else {
        await db.insert('gsc_metrics', metric);
      }
    }
  }

  // Detect and generate SEO opportunities
  const opportunities = await generateSeoOpportunities(rawMetrics);

  return {
    success: true,
    importedRows: rawMetrics.length,
    opportunitiesDetected: opportunities.length,
    startDate,
    endDate,
    durationMs: Date.now() - startTime,
    isMock,
  };
}

/**
 * Synthesizes realistic GSC data grounded in the 500 master keywords and 92 catalog URLs.
 */
async function generateMockGscTelemetry(): Promise<GscMetric[]> {
  const [kwRes, catalogRes] = await Promise.all([
    db.find('keywords', { limit: 120 }),
    db.find('catalog_urls', { limit: 50 }),
  ]);

  const kws = kwRes.rows;
  const metrics: GscMetric[] = [];
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  kws.forEach((kw, index) => {
    const isP1 = kw.priority === 'P1';

    // Simulate positions: some top rank, some striking distance (pos 8-18), some long tail
    let position: number;
    if (index % 5 === 0) position = +(Math.random() * 2 + 1.2).toFixed(1); // Pos 1-3
    else if (index % 3 === 0) position = +(Math.random() * 4 + 4.0).toFixed(1); // Pos 4-8
    else if (index % 2 === 0) position = +(Math.random() * 10 + 8.5).toFixed(1); // Striking distance (8.5 - 18.5)
    else position = +(Math.random() * 20 + 20).toFixed(1);

    const baseImpressions = isP1 ? Math.floor(Math.random() * 4000 + 1200) : Math.floor(Math.random() * 800 + 250);
    let ctr = 0.02;
    if (position <= 2) ctr = +(Math.random() * 0.15 + 0.15).toFixed(3);
    else if (position <= 5) ctr = +(Math.random() * 0.04 + 0.02).toFixed(3); // potential low ctr
    else if (position <= 10) ctr = +(Math.random() * 0.02 + 0.015).toFixed(3);
    else ctr = +(Math.random() * 0.008 + 0.002).toFixed(3);

    const clicks = Math.round(baseImpressions * ctr);

    metrics.push({
      id: `gsc-m-${kw.id || index}`,
      query: kw.keyword,
      page: kw.target_path || '/regalos/',
      clicks,
      impressions: baseImpressions,
      ctr,
      position,
      date: dateStr,
      created_at: now,
    });
  });

  return metrics;
}
