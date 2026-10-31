import { db } from '@/lib/db';
import type { GscMetric, GscOpportunity } from '@/lib/types';

/**
 * Expected average CTR benchmark by position for organic search.
 */
export function getExpectedCtr(position: number): number {
  if (position <= 1.5) return 0.28;
  if (position <= 2.5) return 0.15;
  if (position <= 3.5) return 0.10;
  if (position <= 5.0) return 0.06;
  if (position <= 10.0) return 0.025;
  return 0.01;
}

/**
 * Evaluates performance metrics and generates prioritized SEO opportunities.
 */
export async function generateSeoOpportunities(metrics: GscMetric[]): Promise<GscOpportunity[]> {
  const opportunities: GscOpportunity[] = [];
  const now = new Date().toISOString();

  // Deduplicate and group by query
  const queryMap = new Map<string, GscMetric>();
  let maxImpressions = 0;
  for (const m of metrics) {
    if (m.impressions > maxImpressions) maxImpressions = m.impressions;
    const existing = queryMap.get(m.query);
    if (!existing || m.impressions > existing.impressions) {
      queryMap.set(m.query, m);
    }
  }

  // Adaptive threshold so newer sites with real GSC data still surface opportunities
  const sdMinImpressions = maxImpressions >= 250 ? 250 : 2;
  const ctrMinImpressions = maxImpressions >= 200 ? 200 : 4;

  for (const m of queryMap.values()) {
    const expected = getExpectedCtr(m.position);

    // 1. Striking Distance: Page 2 / Bottom of Page 1 (Pos 6 to 25)
    if (m.position >= 6.0 && m.position <= 25.0 && m.impressions >= sdMinImpressions) {
      const potentialClicks = Math.max(1, Math.round(m.impressions * 0.12)); // estimated clicks if moved to top 3
      opportunities.push({
        id: `opp-sd-${m.id}`,
        type: 'striking_distance',
        query: m.query,
        page: m.page,
        impressions: m.impressions,
        clicks: m.clicks,
        current_position: Number(m.position.toFixed(1)),
        expected_ctr: Number(expected.toFixed(3)),
        actual_ctr: Number(m.ctr.toFixed(3)),
        potential_clicks: potentialClicks,
        action_recommended: `Ranked #${m.position.toFixed(1)}. Add "${m.query}" to an H2 header, enrich content with buyer tips, and build 2 internal links from the silo hub.`,
        status: 'pending',
        created_at: now,
      });
    }

    // 2. Low CTR: High ranking (Pos 1 to 8) but CTR is substantially below expectation
    else if (m.position <= 8.0 && m.impressions >= ctrMinImpressions && m.ctr < expected * 0.7) {
      const missingClicks = Math.max(1, Math.round(m.impressions * (expected - m.ctr)));
      opportunities.push({
        id: `opp-ctr-${m.id}`,
        type: 'low_ctr',
        query: m.query,
        page: m.page,
        impressions: m.impressions,
        clicks: m.clicks,
        current_position: Number(m.position.toFixed(1)),
        expected_ctr: Number(expected.toFixed(3)),
        actual_ctr: Number(m.ctr.toFixed(3)),
        potential_clicks: missingClicks,
        action_recommended: `High visibility (#${m.position.toFixed(1)}) but CTR is only ${(m.ctr * 100).toFixed(1)}% (vs expected ${(expected * 100).toFixed(1)}%). Rewrite title tag and meta description with numbers and emotional triggers.`,
        status: 'pending',
        created_at: now,
      });
    }
  }

  // Clear existing opportunities and save new ones
  for (const opp of opportunities) {
    const existing = await db.findOne('gsc_opportunities', { id: opp.id });
    if (!existing) {
      await db.insert('gsc_opportunities', opp);
    }
  }

  return opportunities;
}
