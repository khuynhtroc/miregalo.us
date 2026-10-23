import { SITE_URL, postPath } from '@/lib/urls';
import type { Post } from '@/lib/types';
import type { ChannelShareResult } from './types';

const TG_API = 'https://api.telegram.org';

/**
 * Tests Telegram Bot token and verifies access to the target Channel/Chat.
 */
export async function testTelegramConnection(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; bot_username?: string; chat_title?: string; error?: string }> {
  try {
    const cleanToken = (botToken || '').trim();
    const cleanChat = (chatId || '').trim();
    if (!cleanToken || !cleanChat) {
      return { success: false, error: 'Vui lòng nhập đầy đủ Bot Token và Channel Username/ID (VD: @miregalo_us)' };
    }

    const meRes = await fetch(`${TG_API}/bot${cleanToken}/getMe`);
    const meData = await meRes.json();
    if (!meRes.ok || !meData?.ok) {
      return {
        success: false,
        error: meData?.description || 'Bot Token không hợp lệ. Hãy kiểm tra lại token từ @BotFather.',
      };
    }

    const chatRes = await fetch(`${TG_API}/bot${cleanToken}/getChat?chat_id=${encodeURIComponent(cleanChat)}`);
    const chatData = await chatRes.json();
    if (!chatRes.ok || !chatData?.ok) {
      return {
        success: false,
        error:
          chatData?.description ||
          `Bot @${meData.result?.username} chưa tìm thấy hoặc chưa được thêm làm Admin vào Channel "${cleanChat}".`,
      };
    }

    return {
      success: true,
      bot_username: meData.result?.username,
      chat_title: chatData.result?.title || chatData.result?.username || cleanChat,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Publishes a post with hero image (or rich link preview) to a Telegram Channel/Group.
 */
export async function shareToTelegram(
  post: Post,
  botToken: string,
  chatId: string,
  template?: string
): Promise<ChannelShareResult> {
  const timestamp = new Date().toISOString();
  try {
    const cleanToken = (botToken || '').trim();
    const cleanChat = (chatId || '').trim();
    if (!cleanToken || !cleanChat) {
      return {
        channel: 'telegram',
        success: false,
        error: 'Telegram Bot Token hoặc Chat ID bị thiếu',
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

    const text = template
      ? template
          .replace(/{title}/g, title)
          .replace(/{excerpt}/g, excerpt)
          .replace(/{url}/g, postUrl)
      : `🎁 ${title}\n\n${excerpt}\n\n👉 Descubre todas las ideas aquí:\n${postUrl}`;

    // Try sending as a photo post first if the article has an image and caption <= 1024 chars
    if (imageUrl && text.length <= 1024) {
      const photoRes = await fetch(`${TG_API}/bot${cleanToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChat,
          photo: imageUrl,
          caption: text,
        }),
      });
      const photoData = await photoRes.json();
      if (photoRes.ok && photoData?.ok) {
        const msgId = photoData.result?.message_id;
        const cleanChannelName = cleanChat.startsWith('@') ? cleanChat.slice(1) : '';
        return {
          channel: 'telegram',
          success: true,
          post_id: String(msgId),
          url: cleanChannelName ? `https://t.me/${cleanChannelName}/${msgId}` : undefined,
          message: 'Đã đăng bài kèm ảnh lên Telegram Channel thành công',
          timestamp,
        };
      }
    }

    // Fallback: sendMessage with link preview enabled
    const msgRes = await fetch(`${TG_API}/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChat,
        text,
        disable_web_page_preview: false,
      }),
    });
    const msgData = await msgRes.json();
    if (!msgRes.ok || !msgData?.ok) {
      return {
        channel: 'telegram',
        success: false,
        error: msgData?.description || 'Không thể gửi bài lên Telegram Channel',
        timestamp,
      };
    }

    const msgId = msgData.result?.message_id;
    const cleanChannelName = cleanChat.startsWith('@') ? cleanChat.slice(1) : '';
    return {
      channel: 'telegram',
      success: true,
      post_id: String(msgId),
      url: cleanChannelName ? `https://t.me/${cleanChannelName}/${msgId}` : undefined,
      message: 'Đã đăng bài lên Telegram Channel thành công',
      timestamp,
    };
  } catch (err: any) {
    return {
      channel: 'telegram',
      success: false,
      error: err?.message || String(err),
      timestamp,
    };
  }
}
