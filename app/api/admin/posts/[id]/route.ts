import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Post } from '@/lib/types';
import { autoSubmitPostIndexing, submitUrlToGoogle } from '@/lib/indexing/google';
import { SITE_URL } from '@/lib/urls';
import { schedulePublishedPostAutoShare } from '@/lib/social/schedule-auto-share';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const post = await db.findOne('posts', { id });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const patch = (await req.json()) as Partial<Post>;
    const existing = await db.findOne('posts', { id });

    if (patch.status === 'published' && !patch.published_at) {
      patch.published_at = new Date().toISOString();
    }

    const updated = await db.update('posts', id, patch);

    try {
      revalidatePath('/', 'layout');
      if (updated?.slug) {
        revalidatePath(`/${updated.slug}/`);
        revalidatePath(`/blog/${updated.slug}/`);
      }
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }

    // Auto-submit URL to Google Indexing if status is published
    if (updated?.status === 'published' && updated?.slug) {
      autoSubmitPostIndexing(updated.slug, 'post').catch((err) => {
        console.warn('[Auto Indexing] Error triggering on post update:', err);
      });
      if (existing?.status !== 'published') {
        await schedulePublishedPostAutoShare(updated, 'admin post publication');
      }
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await db.findOne('posts', { id });
    await db.remove('posts', id);

    // Notify Google of URL deletion if previously published
    if (existing?.slug && existing?.status === 'published') {
      const fullUrl = `${SITE_URL}/${existing.slug.replace(/^\/|\/$/g, '')}/`;
      submitUrlToGoogle(fullUrl, 'URL_DELETED').catch((err) => {
        console.warn('[Auto Indexing] Error notifying Google of deleted URL:', err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
