import { getAuthors } from '@/lib/repo';
import { AuthorManager } from './AuthorManager';

export default async function AdminAuthorsPage() {
  const authors = await getAuthors();
  return <AuthorManager initialAuthors={authors} />;
}
