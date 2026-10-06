import { NextResponse, type NextRequest } from 'next/server';
import { searchPosts } from '@/lib/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'all') as 'all' | 'gift' | 'blog';
  const topic = searchParams.get('topic') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '20', 10);

  try {
    const results = await searchPosts({
      q,
      type,
      topic,
      page,
      perPage,
    });
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error en la búsqueda' }, { status: 500 });
  }
}
