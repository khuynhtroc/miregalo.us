import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { AnalyticsOverview } from '@/lib/types';
import { DEFAULT_ANALYTICS } from '@/lib/analytics/data';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await db.find('analytics', { limit: 1 });
  if (res.rows && res.rows.length > 0) {
    return NextResponse.json(res.rows[0]);
  }
  return NextResponse.json(DEFAULT_ANALYTICS);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const existing = await db.findOne('analytics', { id: 'analytics-main' });
    const updated: AnalyticsOverview = {
      ...DEFAULT_ANALYTICS,
      ...(existing || {}),
      ...body,
      id: 'analytics-main',
      last_updated: new Date().toISOString(),
    };
    if (existing) {
      await db.update('analytics', 'analytics-main', updated as any);
    } else {
      await db.insert('analytics', updated as any);
    }
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save analytics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

