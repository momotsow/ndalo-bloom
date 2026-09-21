import type { MetadataRoute } from "next";
import { loadPublicConfig } from "@/config/public";
import { catalogueService } from "@/application/catalogue/catalogue-service";
import { catalogueRepository } from "@/data/catalogue/catalogue-repository";

/**
 * Sitemap for catalogue surfaces. Products use their canonical /products/[slug] URL.
 * Failures degrade to the static entries so the sitemap always renders.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = loadPublicConfig().NEXT_PUBLIC_APP_URL;
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/shop`, priority: 0.9 },
  ];

  try {
    const [products, tree] = await Promise.all([
      catalogueService.listProducts({ pageSize: 48 }),
      catalogueRepository.categoryTree(),
    ]);
    for (const p of products.items) {
      entries.push({ url: `${base}/products/${p.slug}`, priority: 0.8 });
    }
    for (const c of tree) {
      entries.push({ url: `${base}/categories/${c.slug}`, priority: 0.6 });
    }
  } catch {
    // Degrade gracefully to static entries.
  }

  return entries;
}
