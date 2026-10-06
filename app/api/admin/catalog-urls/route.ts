import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { CatalogUrl } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const priority = searchParams.get('priority');
  const status = searchParams.get('status');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const res = await db.find('catalog_urls', {
    order: [{ field: 'id', asc: true }],
  });

  let rows = res.rows;

  if (type) rows = rows.filter((r) => r.url_type === type);
  if (priority) rows = rows.filter((r) => r.priority === priority);
  if (status) rows = rows.filter((r) => r.status === status);
  if (q) {
    const term = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.page_title.toLowerCase().includes(term) ||
        r.url.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
    );
  }

  const total = rows.length;
  const offset = (page - 1) * limit;
  const pagedRows = rows.slice(offset, offset + limit);

  return NextResponse.json({ rows: pagedRows, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as Partial<CatalogUrl>;
  if (!body.url || !body.page_title) {
    return NextResponse.json({ error: 'URL and page_title are required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const created = await db.insert('catalog_urls', {
    id: body.id || `URL-${Date.now().toString().slice(-3)}`,
    url: body.url,
    page_title: body.page_title,
    url_type: body.url_type || 'RECIPIENT',
    parent_url: body.parent_url || '/regalos/',
    priority: body.priority || 'P1',
    status: body.status || 'LIVE',
    notes: body.notes || '',
    meta_description: body.meta_description || '',
    h1: body.h1 || body.page_title,
    created_at: now,
    updated_at: now,
  });

  return NextResponse.json(created);
}
