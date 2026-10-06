import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Merchant } from '@/lib/types';
import { slugify } from '@/lib/urls';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows, total } = await db.find('merchants', {
    order: [{ field: 'name', asc: true }],
  });

  return NextResponse.json({ rows, total });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as Partial<Merchant>;
  if (!body.name || !body.website_url) {
    return NextResponse.json({ error: 'Name and website_url are required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const slug = body.slug || slugify(body.name);

  const created = await db.insert('merchants', {
    id: body.id || `mch-${slug}`,
    name: body.name,
    slug,
    website_url: body.website_url,
    affiliate_network: body.affiliate_network || 'Direct',
    affiliate_param: body.affiliate_param || '',
    commission_rate: body.commission_rate || '',
    logo_url: body.logo_url || '',
    notes: body.notes || '',
    active: body.active !== false,
    created_at: now,
    updated_at: now,
  });

  return NextResponse.json(created);
}
