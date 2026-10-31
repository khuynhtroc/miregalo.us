import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8963212620:AAHaDbrh0YY7w1f6ULjkbQzrSpEMtx2PoUE';
const AUTHORIZED_CHAT_ID = 8612893214;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SITE_URL = 'https://www.miregalo.us';

async function tgCall(method: string, body: Record<string, any>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err: any) {
    console.error(`Telegram API error (${method}):`, err);
    return { ok: false, error: err.message };
  }
}

async function sendTgMessage(chatId: number, text: string, replyMarkup?: any) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

async function askGemini(prompt: string): Promise<string> {
  const systemPrompt = `You are the Senior AI Executive Assistant for Miregalo.US (https://www.miregalo.us) - an elite gift recommendation and lifestyle catalog.
Xưng hô bằng tiếng Việt: Em - gọi người dùng là Sếp (Admin).
Expertise:
- Curated gift guides for all occasions: Halloween, Thanksgiving, Christmas, Valentine's, Anniversaries, Tech gadgets, Luxury gifts.
- US eCommerce affiliate marketing (Amazon, Pinterest, Etsy).
- Programmatic SEO, high-intent transactional keywords, and Google Search Console optimization.
Respond thoughtfully, concisely, using valid Telegram HTML formatting (<b>, <i>, <code>, <a>).`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nSếp hỏi: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Dạ thưa Sếp, AI đang bận phân tích xu hướng quà tặng, xin thử lại sau giây lát ạ!';
  } catch (e: any) {
    console.error('Gemini error:', e);
    return 'Dạ thưa Sếp, em gặp lỗi khi kết nối AI: ' + e.message;
  }
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const msg = update.message;
    if (!msg || !msg.text) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (chatId !== AUTHORIZED_CHAT_ID) {
      await sendTgMessage(
        chatId,
        '🔒 <b>Miregalo Security:</b> This internal assistant only responds to the Admin!'
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/start' || text === '/help') {
      const help = [
        `🎁 <b>TRỢ LÝ QUẢN TRỊ MIREGALO.US (WEBHOOK CLOUD 24/7)</b>`,
        `<i>Hệ thống trực tuyến 24/7 trên Cloudflare Edge, luôn sẵn sàng hỗ trợ Sếp bất kỳ lúc nào!</i>\n`,
        `📌 <b>CÁC LỆNH NHANH:</b>`,
        `• <code>/ideas &lt;dịp/đối tượng&gt;</code> : Lên ý tưởng quà tặng độc đáo (VD: <code>/ideas Halloween gifts for boyfriend</code>)`,
        `• <code>/status</code> : Kiểm tra trạng thái máy chủ & Cloudflare`,
        `• <code>/help</code> : Xem bảng hướng dẫn này\n`,
        `💬 Sếp có thể chat tự nhiên yêu cầu tìm kiếm sản phẩm, lên dàn ý bài viết quà tặng hoặc tối ưu SEO cho thị trường Mỹ!`,
      ].join('\n');

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🎃 Halloween Gift Guides', callback_data: 'cmd_ideas_halloween' },
            { text: '🎄 Christmas Trends', callback_data: 'cmd_ideas_xmas' },
          ],
          [
            { text: '🌐 Mở Website Miregalo.US', url: SITE_URL },
            { text: '⚙️ Trang Admin Quản Trị', url: `${SITE_URL}/admin` },
          ],
        ],
      };

      await sendTgMessage(chatId, help, keyboard);
      return NextResponse.json({ ok: true });
    }

    if (text === '/status') {
      const statusMsg = [
        `🟢 <b>HỆ THỐNG MIREGALO.US ONLINE 24/7</b>`,
        `• Nền tảng: <b>Next.js Edge Serverless (Cloudflare)</b>`,
        `• Tốc độ phản hồi: <b>~20ms</b>`,
        `• Thị trường trọng tâm: <b>Hoa Kỳ & Toàn cầu (US/Global)</b>`,
        `• Thời gian: <code>${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</code>`,
      ].join('\n');
      await sendTgMessage(chatId, statusMsg);
      return NextResponse.json({ ok: true });
    }

    // AI Chat
    const aiReply = await askGemini(text);
    await sendTgMessage(chatId, aiReply);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Miregalo webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: 'Miregalo Bot',
    platform: 'Cloudflare Edge Serverless',
    time: new Date().toISOString(),
  });
}
