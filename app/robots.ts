import type { MetadataRoute } from "next";
import { loadPublicConfig } from "@/config/public";

export default function robots(): MetadataRoute.Robots {
  const base = loadPublicConfig().NEXT_PUBLIC_APP_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search results and the private/transient cart are not indexable.
        disallow: ["/search", "/cart", "/dev/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
