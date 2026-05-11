/** Public-facing storefront URL (used in bot replies). */
export function storeUrl(path: string = "/"): string {
  const base = (process.env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Telegram requires HTTPS URLs in inline-keyboard buttons and <a> tags.
 * Returns the URL if it's HTTPS, otherwise null — callers should fall back
 * to plain-text or skip the button. In dev (PUBLIC_BASE_URL=http://localhost),
 * set TELEGRAM_LINK_BASE_URL=https://mylanka.com.ua (or your tunnel) to keep
 * buttons working.
 */
export function safeLinkUrl(path: string = "/"): string | null {
  const linkBase = process.env.TELEGRAM_LINK_BASE_URL ?? process.env.PUBLIC_BASE_URL;
  if (!linkBase || !linkBase.startsWith("https://")) return null;
  const trimmed = linkBase.replace(/\/+$/, "");
  return `${trimmed}${path.startsWith("/") ? path : `/${path}`}`;
}
