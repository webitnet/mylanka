"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string };

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] w-full rounded-sm bg-wheat" aria-hidden />
    );
  }
  const main = images[active];
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-wheat">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-sm border bg-wheat",
                i === active ? "border-terracotta" : "border-border hover:border-bark transition",
              )}
            >
              <Image src={img.url} alt={img.alt} fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
