import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "https://mylanka.com.ua").replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl(),
  };
}
