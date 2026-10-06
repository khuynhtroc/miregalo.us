import Link from 'next/link';
import type { Post, Category } from '@/lib/types';
import { postPath } from '@/lib/urls';
import { fmtDate } from '@/lib/format';

interface PostCardProps {
  post: Post;
  category?: Category | null;
  variant?: 'featured' | 'compact' | 'standard';
  priority?: boolean;
}

export function PostCard({ post, category, variant = 'standard', priority = false }: PostCardProps) {
  const path = postPath(post);
  const cardClass = `card card-${variant}`;
  const categoryName = category?.name || 'Gifts';
  const categoryLink = category ? `/${category.slug}/` : '/gifts/';

  return (
    <article className={cardClass}>
      <Link className="card-image" href={path} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.hero_image || 'https://storage.googleapis.com/loveable.appspot.com/medium_personalized_gifts_for_wife_5bd9ed5d3a/medium_personalized_gifts_for_wife_5bd9ed5d3a.png'}
          alt={post.hero_alt || post.title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </Link>
      <div className="card-body">
        <Link className="card-taxonomy" href={categoryLink}>
          {categoryName}
        </Link>
        <h3>
          <Link href={path}>{post.title}</Link>
        </h3>
        {variant === 'featured' && post.excerpt && (
          <p className="card-description">{post.excerpt}</p>
        )}
        <div className="meta">
          <time dateTime={post.published_at || post.created_at}>
            {fmtDate(post.published_at || post.created_at)}
          </time>
        </div>
      </div>
    </article>
  );
}
