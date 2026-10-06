import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncPostItemsWithAffiliateNetworks } from '@/lib/affiliate/sync';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let options = {};
    try {
      options = await req.json();
    } catch {}

    const result = await syncPostItemsWithAffiliateNetworks(options);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
