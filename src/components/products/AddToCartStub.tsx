"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function AddToCartStub({
  stock,
  className,
}: {
  stock: number;
  className?: string;
}) {
  const t = useTranslations("Product");
  const tDetail = useTranslations("ProductDetail");
  const [qty, setQty] = useState(1);
  const outOfStock = stock <= 0;

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <label className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          {tDetail("quantity")}
        </label>
        <div className="inline-flex items-center rounded-sm border border-border">
          <button
            type="button"
            disabled={qty <= 1 || outOfStock}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 text-bark disabled:opacity-40"
            aria-label="-"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            type="button"
            disabled={qty >= stock || outOfStock}
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="px-3 py-1.5 text-bark disabled:opacity-40"
            aria-label="+"
          >
            +
          </button>
        </div>
      </div>
      <Button
        size="lg"
        disabled={outOfStock}
        className="mt-5 w-full"
        onClick={() => {
          // Wired in iteration C
          console.info("[cart] add", { qty });
        }}
      >
        {outOfStock ? t("outOfStock") : t("addToCart")}
      </Button>
    </div>
  );
}
