/**
 * Telegram Mini App initData validation.
 * Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Algorithm:
 *   secret_key = HMAC_SHA256("WebAppData", bot_token)
 *   data_check_string = sorted entries (excluding `hash`) joined by "\n"
 *   expected_hash = HMAC_SHA256(secret_key, data_check_string).hex
 *
 * We also reject payloads older than MAX_AGE_SEC to prevent replays.
 */
import crypto from "node:crypto";

const MAX_AGE_SEC = 24 * 60 * 60; // 24 hours

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type InitDataValidation =
  | { ok: true; user: TelegramUser; authDate: number; raw: URLSearchParams }
  | { ok: false; reason: "missing_hash" | "bad_signature" | "expired" | "no_user" | "bad_payload" };

export function validateInitData(
  initData: string,
  botToken: string,
  opts?: { maxAgeSec?: number },
): InitDataValidation {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing_hash" };

  const authDateRaw = params.get("auth_date");
  if (!authDateRaw) return { ok: false, reason: "bad_payload" };
  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate)) return { ok: false, reason: "bad_payload" };

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, reason: "no_user" };

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return { ok: false, reason: "bad_payload" };
  }

  // Reject stale payloads (replay attack protection).
  const maxAge = opts?.maxAgeSec ?? MAX_AGE_SEC;
  if (Date.now() / 1000 - authDate > maxAge) {
    return { ok: false, reason: "expired" };
  }

  // Build sorted data-check string, excluding `hash`.
  const entries: [string, string][] = [];
  for (const [k, v] of params.entries()) {
    if (k === "hash") continue;
    entries.push([k, v]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  // Note: per Telegram spec, secret_key is HMAC of key="WebAppData", message=botToken.
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Constant-time comparison.
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  return { ok: true, user, authDate, raw: params };
}
