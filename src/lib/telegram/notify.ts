/**
 * Telegram admin notifications. Best-effort: failures are logged but never
 * thrown so checkout / webhooks don't fail because of TG downtime.
 *
 * Configure via env:
 *   TELEGRAM_BOT_TOKEN       — bot token from @BotFather
 *   TELEGRAM_ADMIN_CHAT_ID   — supergroup id (negative, e.g. "-100...")
 */
const API_BASE = "https://api.telegram.org";

function config(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

export async function notifyAdmin(html: string): Promise<void> {
  const cfg = config();
  if (!cfg) {
    console.warn("[tg notify] missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID");
    return;
  }
  await sendMessage(cfg.token, cfg.chatId, html);
}

/** Send a message to an arbitrary chat (e.g. customer DM by telegramId). */
export async function notifyChat(
  chatId: string | number,
  html: string,
  opts?: { replyMarkup?: object },
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[tg notify] missing TELEGRAM_BOT_TOKEN");
    return;
  }
  await sendMessage(token, chatId, html, opts);
}

async function sendMessage(
  token: string,
  chatId: string | number,
  html: string,
  opts?: { replyMarkup?: object },
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[tg notify] sendMessage ${res.status}: ${text}`);
    }
  } catch (err) {
    console.warn("[tg notify] fetch failed", err);
  }
}

/** Escape HTML special chars for Telegram parse_mode=HTML. */
export function tgEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
