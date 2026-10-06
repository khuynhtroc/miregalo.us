import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Author } from '@/lib/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await db.find('authors', { order: [{ field: 'name' }] });
  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as Partial<Author>;
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
    }

    const author = await db.insert('authors', {
      slug: body.slug,
      name: body.name,
      entity_type: body.entity_type || 'Organization',
      job_title: body.job_title || '',
      bio_html: body.bio_html || '',
      avatar: body.avatar || '',
      email: body.email || '',
      website: body.website || '',
      same_as: body.same_as || [],
    });

    return NextResponse.json(author, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, ...patch } = (await req.json()) as Partial<Author> & { id: string };
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updated = await db.update('authors', id, patch);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
