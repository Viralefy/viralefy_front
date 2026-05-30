import type { MetadataRoute } from "next";

// robots.txt — abre tudo pra crawlers honestos, indica o sitemap canônico.
// Em HML/POC queremos que Google + Bing + Yandex indexem tudo.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/account", "/tickets", "/login", "/register", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
