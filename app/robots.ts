import type { MetadataRoute } from "next";
import { loadPublicConfig } from "@/config/public";

export default function robots(): MetadataRoute.Robots {
  const base = loadPublicConfig().NEXT_PUBLIC_APP_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search result pages are not useful to index.
        disallow: ["/search", "/dev/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
