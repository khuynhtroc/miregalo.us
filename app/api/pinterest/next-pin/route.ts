import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SITE_URL, postPath } from '@/lib/urls';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const markDone = searchParams.get('mark_done') === 'true';
  const targetPostId = searchParams.get('post_id');

  try {
    // 1. Fetch categories and catalog URLs to map to Board names
    const [postsRes, categoriesRes, catalogUrlsRes] = await Promise.all([
      db.find('posts', { limit: 5000, order: [{ field: 'published_at', asc: true }] }),
      db.find('categories', { limit: 100 }),
      db.find('catalog_urls', { limit: 200 }),
    ]);

    const catMap = new Map(categoriesRes.rows.map((c: any) => [c.id, c.name]));
    const catalogMap = new Map(catalogUrlsRes.rows.map((u: any) => [u.id, u.page_title]));

    // If target post ID is specified and mark_done=true, mark it as pinned
    if (targetPostId && markDone) {
      await db.update('posts', targetPostId, {
        pinterest_pinned: true,
        pinterest_pinned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, message: `Post ${targetPostId} marked as pinned.` });
    }

    // 2. Filter unpinned published posts
    const unpinnedPosts = postsRes.rows.filter((p: any) => {
      if (p.status !== 'published') return false;
      if (p.pinterest_pinned || p.metadata?.pinterest_pinned) return false;
      return true;
    });

    if (unpinnedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'All published posts have already been pinned.',
        total_posts: postsRes.rows.length,
      });
    }

    // 3. Select the oldest unpinned post (FIFO)
    const post = unpinnedPosts[0];

    // 4. Resolve the Board name according to URL MAP / Category / Cluster
    let boardName = 'Ideas de Regalos';
    if (post.primary_category_id && catMap.has(post.primary_category_id)) {
      boardName = `Regalos ${catMap.get(post.primary_category_id)}`;
    } else if (post.category_ids?.length && catMap.has(post.category_ids[0])) {
      boardName = `Regalos ${catMap.get(post.category_ids[0])}`;
    } else if ((post as any).cluster) {
      boardName = `Regalos para ${(post as any).cluster}`;
    }

    boardName = boardName.replace(/^Regalos\s+para\s+Regalos/i, 'Regalos para');
    boardName = boardName.replace(/^Regalos\s+Regalos/i, 'Regalos');
    if (!boardName.toLowerCase().startsWith('regalos')) {
      boardName = `Regalos: ${boardName}`;
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const heroImage = post.hero_image?.startsWith('http')
      ? post.hero_image
      : `${SITE_URL}${post.hero_image?.startsWith('/') ? '' : '/'}${post.hero_image || 'images/miregalo-logo.png'}`;

    // Auto mark done if requested in single call
    if (markDone) {
      await db.update('posts', post.id, {
        pinterest_pinned: true,
        pinterest_board: boardName,
        pinterest_pinned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      remaining_unpinned: unpinnedPosts.length,
      post: {
        id: post.id,
        title: (post.title || '').slice(0, 100),
        description: (post.seo_description || post.excerpt || post.title || '').slice(0, 500),
        link: postUrl,
        image_url: heroImage,
        board_name: boardName,
        published_at: post.published_at || post.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { post_id, pin_id, board_name } = body;
    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    await db.update('posts', post_id, {
      pinterest_pinned: true,
      pinterest_pin_id: pin_id || undefined,
      pinterest_board: board_name || undefined,
      pinterest_pinned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: `Post ${post_id} marked as pinned.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
