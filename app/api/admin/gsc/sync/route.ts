import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncGscData } from '@/lib/gsc/pipeline';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json().catch(() => ({}))) || {};
    const result = await syncGscData({
      startDate: body.startDate,
      endDate: body.endDate,
      rowLimit: body.rowLimit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error syncing GSC data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
