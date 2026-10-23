import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const BSKY_API = 'https://bsky.social/xrpc';

/**
 * Tests Bluesky Handle + App Password authentication via AT Protocol.
 */
export async function testBlueskyConnection(
  identifier: string,
  appPassword: string
): Promise<{ success: boolean; handle?: string; did?: string; error?: string }> {
  try {
    const cleanId = (identifier || '').trim().replace(/^@/, '');
    const cleanPass = (appPassword || '').trim();
    if (!cleanId || !cleanPass) {
      return {
        success: false,
        error: 'Vui lòng nhập đầy đủ Bluesky Handle (VD: miregalo.bsky.social) và App Password',
      };
    }

    const res = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
    });
    const data = await res.json();
    if (!res.ok || !data?.accessJwt) {
      return {
        success: false,
        error: data?.message || 'Không thể đăng nhập Bluesky. Hãy tạo App Password trong Settings > App Passwords.',
      };
    }

    return {
      success: true,
      handle: data.handle,
      did: data.did,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a post to Bluesky with an embedded External Link Card + Thumbnail Image!
 */
export async function shareToBluesky(
  post: Post,
  identifier: string,
  appPassword: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanId = (identifier || '').trim().replace(/^@/, '');
    const cleanPass = (appPassword || '').trim();
    if (!cleanId || !cleanPass) {
      return {
        channel: 'bluesky',
        success: false,
        error: 'Bluesky Handle hoặc App Password bị thiếu',
        timestamp,
      };
    }

    // 1. Create session
    const sessRes = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
    });
    const sess = await sessRes.json();
    if (!sessRes.ok || !sess?.accessJwt || !sess?.did) {
      return {
        channel: 'bluesky',
        success: false,
        error: sess?.message || 'Lỗi xác thực Bluesky App Password',
        timestamp,
      };
    }

    const postUrl = `${SITE_URL}${postPath(post)}`;
    const title = post.title || 'Guía de Regalos';
    const excerpt = post.seo_description || post.excerpt || '';
    const imageUrl =
      post.og_image ||
      post.hero_image ||
      post.items?.find((it) => it?.image)?.image ||
      '';

    let text = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n👉 ${postUrl}\n\n#regalos #miregalo`;

    // Bluesky limit is 300 graphemes
    if (text.length > 295) {
      const shortTitle = title.slice(0, Math.max(40, 250 - postUrl.length));
      text = `🎁 ${shortTitle}...\n\n👉 ${postUrl}`;
    }

    // Detect byte offsets of postUrl in text so Bluesky makes the link clickable in text too
    const facets: any[] = [];
    const encoder = new TextEncoder();
    const urlIdx = text.indexOf(postUrl);
    if (urlIdx >= 0) {
      const byteStart = encoder.encode(text.slice(0, urlIdx)).byteLength;
      const byteEnd = byteStart + encoder.encode(postUrl).byteLength;
      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: postUrl }],
      });
    }

    // 2. Upload thumbnail blob if imageUrl is available (< 950KB)
    let thumbBlob: any = undefined;
    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          const buf = await imgRes.arrayBuffer();
          if (buf.byteLength > 0 && buf.byteLength < 950_000) {
            const blobRes = await fetch(`${BSKY_API}/com.atproto.repo.uploadBlob`, {
              method: 'POST',
              headers: {
                'Content-Type': contentType,
                Authorization: `Bearer ${sess.accessJwt}`,
              },
              body: buf,
            });
            const blobData = await blobRes.json();
            if (blobRes.ok && blobData?.blob) {
              thumbBlob = blobData.blob;
            }
          }
        }
      } catch {}
    }

    // 3. Create record with external link card embed
    const externalCard: Record<string, any> = {
      uri: postUrl,
      title: title.slice(0, 200),
      description: (excerpt || title).slice(0, 300),
    };
    if (thumbBlob) {
      externalCard.thumb = thumbBlob;
    }

    const record: Record<string, any> = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: timestamp,
      embed: {
        $type: 'app.bsky.embed.external',
        external: externalCard,
      },
    };
    if (facets.length > 0) {
      record.facets = facets;
    }

    const postRes = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sess.accessJwt}`,
      },
      body: JSON.stringify({
        repo: sess.did,
        collection: 'app.bsky.feed.post',
        record,
      }),
    });
    const postData = await postRes.json();
    if (!postRes.ok || !postData?.uri) {
      return {
        channel: 'bluesky',
        success: false,
        error: postData?.message || 'Không thể tạo bài đăng trên Bluesky',
        timestamp,
      };
    }

    const rkey = String(postData.uri).split('/').pop();
    return {
      channel: 'bluesky',
      success: true,
      post_id: postData.uri,
      url: `https://bsky.app/profile/${sess.handle}/post/${rkey}`,
      message: 'Đã đăng bài kèm thẻ ảnh lên Bluesky thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'bluesky',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
