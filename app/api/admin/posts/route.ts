import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Post } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const q = searchParams.get('q') || undefined;

  const eq: Record<string, string> = {};
  if (type) eq.type = type;
  if (status) eq.status = status;

  const res = await db.find('posts', {
    eq: Object.keys(eq).length ? eq : undefined,
    search: q ? { fields: ['title', 'slug', 'excerpt', 'focus_keyword'], term: q } : undefined,
    order: [{ field: 'created_at', asc: false }],
    limit: 200,
  });

  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as Partial<Post>;
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and Slug are required' }, { status: 400 });
    }

    const post = await db.insert('posts', {
      type: body.type || 'gift',
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || '',
      intro_html: body.intro_html || '',
      content_html: body.content_html || '',
      items: body.items || [],
      faqs: body.faqs || [],
      hero_image: body.hero_image || '',
      hero_alt: body.hero_alt || '',
      primary_category_id: body.primary_category_id || null,
      category_ids: body.category_ids || [],
      author_id: body.author_id || null,
      status: body.status || 'draft',
      featured: !!body.featured,
      editor_pick: !!body.editor_pick,
      focus_keyword: body.focus_keyword || '',
      seo_title: body.seo_title || '',
      seo_description: body.seo_description || '',
      canonical_url: body.canonical_url || '',
      robots: body.robots || '',
      og_image: body.og_image || '',
      published_at: body.status === 'published' ? (body.published_at || new Date().toISOString()) : null,
    });

    try {
      revalidatePath('/', 'layout');
      if (post?.slug) {
        revalidatePath(`/${post.slug}/`);
        revalidatePath(`/blog/${post.slug}/`);
      }
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
