import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Product, Post } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const product = await db.findOne('products', { id });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const patch = (await req.json()) as Partial<Product>;
    const updated = await db.update('products', id, {
      ...patch,
      updated_at: new Date().toISOString(),
    });

    // 1. Sync redirect destination in db.redirects if url or slug changed
    if (updated.url && updated.slug) {
      const redSrc = `/go/${updated.slug}/`;
      const existingRed = await db.findOne('redirects', { source: redSrc });
      if (existingRed) {
        await db.update('redirects', existingRed.id, {
          destination: updated.url,
          updated_at: new Date().toISOString(),
        });
      } else {
        await db.insert('redirects', {
          id: `red-prod-${updated.slug}`,
          source: redSrc,
          destination: updated.url,
          code: 302,
          hits: 0,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // 2. Synchronize post items across articles that reference this product
    if (patch.price || patch.merchant || patch.name) {
      const postsRes = await db.find('posts', { limit: 2000 });
      const targetSlug = updated.slug;
      const targetId = updated.id;

      for (const post of (postsRes.rows || []) as Post[]) {
        let changed = false;
        const newItems = (post.items || []).map((item) => {
          const isMatching =
            item.product_id === targetId ||
            (item.url && item.url.includes(`/go/${targetSlug}/`));

          if (isMatching) {
            changed = true;
            return {
              ...item,
              heading: patch.name || item.heading,
              price: patch.price || item.price,
              merchant: patch.merchant || item.merchant,
              button_label: patch.merchant ? `Ver en ${patch.merchant}` : item.button_label,
            };
          }
          return item;
        });

        if (changed) {
          await db.update('posts', post.id, { items: newItems, updated_at: new Date().toISOString() });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await db.remove('products', id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
