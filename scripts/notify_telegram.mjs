import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function loadEnv() {
  const env = {};
  for (const envName of ['.env.local', '.env']) {
    const p = path.join(ROOT_DIR, envName);
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !env[m[1]]) {
          env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }
  return env;
}

export async function sendTelegramUpdate(title, details, tags = null) {
  const env = loadEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '8963212620:AAHaDbrh0YY7w1f6ULjkbQzrSpEMtx2PoUE';
  const chatId = process.env.TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID || '8612893214';

  const now = new Date();
  const nowStr = now.toLocaleTimeString('vi-VN', { hour12: false }) + ' - ' + now.toLocaleDateString('vi-VN');

  const msgLines = [
    `🎁 <b>[Miregalo.US] CẬP NHẬT HỆ THỐNG MỚI</b>`,
    `⏱ <i>Thời gian: ${nowStr}</i>`,
    `━━━━━━━━━━━━━━━━━━`,
    `📌 <b>Nội dung cập nhật:</b>`,
    `<b>${title}</b>\n`,
  ];

  if (Array.isArray(details)) {
    for (const item of details) {
      msgLines.push(`• ${item}`);
    }
  } else if (details) {
    msgLines.push(String(details));
  }

  msgLines.push(`\n━━━━━━━━━━━━━━━━━━`);
  msgLines.push(`🌐 <i>Website: https://miregalo.us</i>`);
  if (tags) {
    msgLines.push(`🏷 ${tags}`);
  } else {
    msgLines.push(`🏷 #miregalo #giftblog #social #autopost #update`);
  }

  const text = msgLines.join('\n');
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log('✓ Đã gửi thông báo Telegram bot Miregalo thành công!');
      return true;
    } else {
      console.error('X Lỗi gửi Telegram bot Miregalo:', data);
      return false;
    }
  } catch (err) {
    console.error('X Ngoại lệ khi gửi Telegram:', err);
    return false;
  }
}

// CLI runner
const args = process.argv.slice(2);
if (args.length > 0) {
  const title = args[0];
  const details = args.slice(1);
  await sendTelegramUpdate(title, details.length ? details : ['Hệ thống đã cập nhật thành công.']);
}
