import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com").replace(/\/$/, "");
  return ["", "/scan", "/history", "/analytics", "/settings"].map(path => ({
    url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.6
  }));
}
