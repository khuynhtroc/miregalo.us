import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const HASHNODE_GQL = 'https://gql.hashnode.com';

export interface HashnodeCredentials {
  accessToken?: string;
  publicationId?: string;
  webhookUrl?: string;
}

export async function testHashnodeConnection(
  creds: HashnodeCredentials
): Promise<{ success: boolean; publication_title?: string; error?: string }> {
  try {
    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', test: true, timestamp: new Date().toISOString() }),
      });
      return { success: res.ok, publication_title: 'Webhook endpoint' };
    }

    const { accessToken, publicationId } = creds;
    if (!accessToken) {
      return { success: false, error: 'Vui lòng cung cấp Hashnode Personal Access Token hoặc Webhook URL' };
    }

    if (!publicationId) {
      // Fetch user's publications
      const query = `
        query {
          me {
            username
            name
          }
        }
      `;
      const res = await fetch(HASHNODE_GQL, {
        method: 'POST',
        headers: {
          Authorization: accessToken.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.errors) {
        return { success: false, error: data?.errors?.[0]?.message || 'Token không hợp lệ' };
      }
      return { success: true, publication_title: `@${data.data?.me?.username}` };
    }

    // Verify publication ID
    const query = `
      query GetPub($id: ObjectId!) {
        publication(id: $id) {
          title
          url
        }
      }
    `;
    const res = await fetch(HASHNODE_GQL, {
      method: 'POST',
      headers: {
        Authorization: accessToken.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { id: publicationId.trim() } }),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.errors) {
      return { success: false, error: data.errors[0]?.message || 'Lỗi truy vấn Hashnode Publication' };
    }

    return {
      success: true,
      publication_title: data?.data?.publication?.title || publicationId,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function shareToHashnode(
  post: Post,
  creds: HashnodeCredentials,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const imageUrl = post.hero_image || post.og_image || '';

    const webhookUrl = (creds.webhookUrl || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'hashnode',
          title,
          url: postUrl,
          excerpt,
          image_url: imageUrl,
          timestamp,
        }),
      });
      return {
        channel: 'hashnode',
        success: res.ok,
        url: postUrl,
        error: res.ok ? undefined : `Webhook trả về HTTP ${res.status}`,
        timestamp,
      };
    }

    const { accessToken, publicationId } = creds;
    if (!accessToken || !publicationId) {
      return {
        channel: 'hashnode',
        success: false,
        error: 'Thiếu Hashnode Access Token hoặc Publication ID',
        timestamp,
      };
    }

    const contentMarkdown = `
# ${title}

${excerpt}

![Cover](${imageUrl})

👉 **Descubre la guía completa y todos los productos aquí:** [${postUrl}](${postUrl})

---
*Publicado automáticamente desde [Miregalo.US](${SITE_URL})*
`.trim();

    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            id
            title
            url
          }
        }
      }
    `;

    const variables = {
      input: {
        title,
        contentMarkdown,
        publicationId: publicationId.trim(),
        originalArticleURL: postUrl,
        coverImageOptions: imageUrl ? { coverImageURL: imageUrl } : undefined,
      },
    };

    const res = await fetch(HASHNODE_GQL, {
      method: 'POST',
      headers: {
        Authorization: accessToken.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.errors) {
      const msg = data?.errors?.map((e: any) => e.message).join(', ') || `HTTP ${res.status}`;
      return {
        channel: 'hashnode',
        success: false,
        error: `Lỗi đăng Hashnode: ${msg}`,
        timestamp,
      };
    }

    const published = data?.data?.publishPost?.post;
    return {
      channel: 'hashnode',
      success: true,
      post_id: published?.id,
      url: published?.url || postUrl,
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'hashnode',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
