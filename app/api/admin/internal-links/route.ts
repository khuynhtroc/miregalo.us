import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { buildInternalLinkGraph } from '@/lib/ai/internal-linker';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await buildInternalLinkGraph();
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown link error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
