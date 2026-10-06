import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Keyword } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cluster = searchParams.get('cluster') || undefined;
  const status = searchParams.get('status') || undefined;
  const q = searchParams.get('q') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const eq: Record<string, string> = {};
  if (cluster) eq.cluster = cluster;
  if (status) eq.status = status;

  const res = await db.find('keywords', {
    eq: Object.keys(eq).length ? eq : undefined,
    search: q ? { fields: ['keyword', 'target_path', 'cluster'], term: q } : undefined,
    order: [{ field: 'priority', asc: false }, { field: 'keyword' }],
    limit,
    offset: (page - 1) * limit,
  });

  return NextResponse.json(res);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, ...patch } = (await req.json()) as Partial<Keyword> & { id: string };
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updated = await db.update('keywords', id, patch);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
