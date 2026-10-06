import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Category } from '@/lib/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await db.find('categories', {
    order: [{ field: 'sort_order' }, { field: 'name' }],
  });
  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as Partial<Category>;
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
    }

    const category = await db.insert('categories', {
      slug: body.slug,
      name: body.name,
      group: body.group || 'recipients',
      eyebrow: body.eyebrow || 'Gift guides',
      short_intro: body.short_intro || '',
      description_html: body.description_html || '',
      hero_image: body.hero_image || '',
      seo_title: body.seo_title || '',
      seo_description: body.seo_description || '',
      sort_order: body.sort_order ?? 10,
      show_in_nav: body.show_in_nav ?? true,
      show_in_footer: body.show_in_footer ?? true,
      quick_link: body.quick_link ?? false,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
