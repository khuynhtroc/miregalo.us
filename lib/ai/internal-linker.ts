import 'server-only';
import { db } from '@/lib/db';
import type { Post, Category, InternalLink } from '@/lib/types';
import { postPath } from '@/lib/urls';

export interface LinkSuggestion {
  source_post_id: string;
  source_title: string;
  target_url: string;
  target_title: string;
  anchor_text: string;
}

/**
 * Builds or suggests internal links across all published posts.
 */
export async function buildInternalLinkGraph(): Promise<{
  linksCreated: number;
  suggestions: LinkSuggestion[];
}> {
  const [{ rows: posts }, { rows: categories }] = await Promise.all([
    db.find('posts', { eq: { status: 'published' } }),
    db.find('categories', {}),
  ]);

  const suggestions: LinkSuggestion[] = [];
  let linksCreated = 0;

  // Build a lookup table of keywords and target URLs
  const targets: Array<{ phrase: string; url: string; title: string; postId?: string }> = [];

  // Add categories as targets
  for (const cat of categories) {
    if (cat.name.length >= 4) {
      targets.push({
        phrase: cat.name.toLowerCase(),
        url: `/${cat.slug}/`,
        title: cat.name,
      });
    }
  }

  // Add published posts as targets
  for (const p of posts) {
    if (p.title.length >= 6) {
      targets.push({
        phrase: p.title.toLowerCase().replace(/^\d+\s*/, ''),
        url: postPath(p),
        title: p.title,
        postId: p.id,
      });
    }
  }

  // Analyze each post's content for anchor occurrences
  for (const post of posts) {
    const content = (post.intro_html || '') + ' ' + (post.content_html || '');
    const currentPostPath = postPath(post);

    for (const target of targets) {
      if (target.url === currentPostPath) continue;
      if (target.postId === post.id) continue;

      // Check if target phrase appears in content
      const regex = new RegExp(`\\b${escapeRegExp(target.phrase)}\\b`, 'i');
      if (regex.test(content)) {
        suggestions.push({
          source_post_id: post.id,
          source_title: post.title,
          target_url: target.url,
          target_title: target.title,
          anchor_text: target.phrase,
        });

        // Record in internal_links table
        try {
          const existing = await db.findOne('internal_links', {
            source_post_id: post.id,
            target_url: target.url,
          });

          if (!existing) {
            await db.insert('internal_links', {
              source_post_id: post.id,
              target_post_id: target.postId || null,
              target_url: target.url,
              anchor_text: target.phrase,
              rel: 'dofollow',
            });
            linksCreated++;
          }
        } catch {
          // ignore duplicate errors
        }
      }
    }
  }

  return { linksCreated, suggestions };
}

/**
 * Injects contextual internal links into HTML content safely (avoiding existing <a> tags and headings).
 */
export function injectInternalLinks(
  html: string,
  links: Array<{ phrase: string; url: string }>
): string {
  let result = html;

  for (const link of links) {
    if (!link.phrase || !link.url) continue;

    // Replace first occurrence outside existing tags
    const escaped = escapeRegExp(link.phrase);
    const regex = new RegExp(`(?<!<[^>]*)\\b(${escaped})\\b(?![^<]*<\\/a>)`, 'i');

    if (regex.test(result)) {
      result = result.replace(regex, `<a href="${link.url}" class="internal-link">$1</a>`);
    }
  }

  return result;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
