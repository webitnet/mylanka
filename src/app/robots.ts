import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "https://mylanka.com.ua").replace(/\/+$/, "");
}

// Block known AI-training crawlers from scraping the catalog. Search engines
// (Googlebot, Bingbot, etc.) remain allowed under the wildcard rule.
const BLOCKED_AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Bytespider",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Amazonbot",
  "Applebot-Extended",
  "Diffbot",
  "DataForSeoBot",
  "ImagesiftBot",
  "Omgilibot",
  "TimpiBot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BLOCKED_AI_BOTS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl(),
  };
}
