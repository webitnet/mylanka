/**
 * Resolves the public-facing base URL for building provider callback URLs.
 * Falls back to http://localhost:3000 in dev. In production set
 * PUBLIC_BASE_URL to https://mylanka.com.ua (or the live domain).
 */
export function publicBaseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
