import type { MetadataRoute } from "next";
import { COUNTRIES } from "@/i18n/countries";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const countries = COUNTRIES.map((c) => ({
    url: `${base}/${c.code}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...countries,
  ];
}
