import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    env = {}
    for env_name in ['.env.local', '.env']:
        p = os.path.join(ROOT_DIR, env_name)
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip("'").strip('"')
                        if k not in env:
                            env[k] = v
    return env

def send_telegram_update(title, details, tags=None):
    env = load_env()
    token = os.environ.get('TELEGRAM_BOT_TOKEN') or env.get('TELEGRAM_BOT_TOKEN', '8963212620:AAHaDbrh0YY7w1f6ULjkbQzrSpEMtx2PoUE')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID') or env.get('TELEGRAM_CHAT_ID', '8612893214')

    now = datetime.now()
    now_str = now.strftime('%H:%M:%S - %d/%m/%Y')

    msg_lines = [
        "🎁 <b>[Miregalo.US] CẬP NHẬT HỆ THỐNG MỚI</b>",
        f"⏱ <i>Thời gian: {now_str}</i>",
        "━━━━━━━━━━━━━━━━━━",
        "📌 <b>Nội dung cập nhật:</b>",
        f"<b>{title}</b>\n"
    ]

    if isinstance(details, list):
        for item in details:
            msg_lines.append(f"• {item}")
    elif details:
        msg_lines.append(str(details))

    msg_lines.append("\n━━━━━━━━━━━━━━━━━━")
    msg_lines.append("🌐 <i>Website: https://miregalo.us</i>")
    if tags:
        msg_lines.append(f"🏷 {tags}")
    else:
        msg_lines.append("🏷 #miregalo #giftblog #social #autopost #update")

    text = "\n".join(msg_lines)
    url = f"https://api.telegram.org/bot{token}/sendMessage"

    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            if res_data.get('ok'):
                print("✓ Đã gửi thông báo Telegram bot Miregalo thành công!")
                return True
            else:
                print("X Lỗi gửi Telegram bot Miregalo:", res_data)
                return False
    except Exception as e:
        print("X Ngoại lệ khi gửi Telegram:", e)
        return False

if __name__ == '__main__':
    args = sys.argv[1:]
    if args:
        title = args[0]
        details = args[1:] if len(args) > 1 else ["Hệ thống đã cập nhật thành công."]
        send_telegram_update(title, details)
    else:
        send_telegram_update("Cập nhật hệ thống Miregalo.US", ["Test notification"])
