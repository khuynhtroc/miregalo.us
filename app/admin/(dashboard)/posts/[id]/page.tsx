import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCategories, getAuthors } from '@/lib/repo';
import { PostEditor } from '../PostEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;

  const [post, categories, authors, productsRes, mediaRes] = await Promise.all([
    db.findOne('posts', { id }),
    getCategories(),
    getAuthors(),
    db.find('products', { limit: 100 }),
    db.find('media', { limit: 100 }),
  ]);

  if (!post) notFound();

  return (
    <PostEditor
      initialPost={post}
      categories={categories}
      authors={authors}
      products={productsRes.rows}
      mediaFiles={mediaRes.rows}
    />
  );
}
