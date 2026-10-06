import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Category } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const patch = (await req.json()) as Partial<Category>;
    const updated = await db.update('categories', id, patch);

    try {
      revalidatePath('/', 'layout');
      if (updated?.slug) {
        revalidatePath(`/${updated.slug}/`);
      }
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
