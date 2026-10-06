import { getCategories, getAuthors } from '@/lib/repo';
import { db } from '@/lib/db';
import { PostEditor } from '../PostEditor';

interface PageProps {
  searchParams: Promise<{ slug?: string; title?: string; type?: string }>;
}

export default async function NewPostPage({ searchParams }: PageProps) {
  const { slug, title, type } = await searchParams;

  const [categories, authors, productsRes, mediaRes] = await Promise.all([
    getCategories(),
    getAuthors(),
    db.find('products', { limit: 100 }),
    db.find('media', { limit: 100 }),
  ]);

  return (
    <PostEditor
      isNew
      initialPost={{
        title: title || '',
        slug: slug || '',
        type: (type as 'gift' | 'blog' | 'page') || 'gift',
        status: 'draft',
      }}
      categories={categories}
      authors={authors}
      products={productsRes.rows}
      mediaFiles={mediaRes.rows}
    />
  );
}
