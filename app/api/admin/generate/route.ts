import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateContent } from '@/lib/ai/content-generator';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const result = await generateContent(body);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown generation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
