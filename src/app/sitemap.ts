import type { MetadataRoute } from "next";
import { allSiteUrls } from "@/lib/site-urls";

// Sitemap canônico. Single-source-of-truth: `lib/site-urls.ts`.
// O mesmo arquivo alimenta o endpoint IndexNow.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const list = await allSiteUrls();
  return list.map((u) => ({
    url: u.url,
    changeFrequency: u.changeFrequency,
    priority: u.priority,
  }));
}
