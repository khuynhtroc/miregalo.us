import { NextRequest, NextResponse } from 'next/server';
import { executeFacebookBackfillStep } from '@/lib/social';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return runBackfill(req);
}

export async function POST(req: NextRequest) {
  return runBackfill(req);
}

async function runBackfill(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const authHeader = req.headers.get('authorization');
  const querySecret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && !isVercelCron && !force) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = querySecret === cronSecret;
    if (!isBearerValid && !isQueryValid) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
    }
  }

  try {
    const step = await executeFacebookBackfillStep({ forceNow: force });
    return NextResponse.json(step.body, { status: step.httpStatus });
  } catch (err: any) {
    console.error('[Social Backfill] Cron failed:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
