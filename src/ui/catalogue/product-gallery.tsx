"use client";

import { useState } from "react";
import { Image } from "@/ui/primitives/image";
import { cn } from "@/ui/primitives/cn";

/**
 * Accessible product image gallery (catalogue-scoped, client component for thumbnail
 * selection). Presentational only — receives ready-to-use image URLs + alt text.
 */
export interface GalleryImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
}

export function ProductGallery({ images }: { readonly images: readonly GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (images.length === 0) return null;
  const active = images[activeIndex] ?? images[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-muted">
        <Image
          src={active.url}
          alt={active.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2" role="list">
          {images.map((img, index) => (
            <li key={img.id}>
              <button
                type="button"
                aria-label={`View image ${index + 1}: ${img.alt}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-14 overflow-hidden rounded-md border",
                  index === activeIndex ? "border-accent" : "border-border",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                )}
              >
                <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
