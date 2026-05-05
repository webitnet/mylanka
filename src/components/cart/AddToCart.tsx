"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useCartStore, type CartItem } from "@/lib/cart/store";

type Props = {
  product: Omit<CartItem, "qty">;
  stock: number;
  className?: string;
};

export function AddToCart({ product, stock, className }: Props) {
  const tProduct = useTranslations("Product");
  const tDetail = useTranslations("ProductDetail");
  const tCart = useTranslations("Cart");
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = stock <= 0;

  function handleAdd() {
    if (outOfStock) return;
    add(product, Math.min(qty, stock));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

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
        onClick={handleAdd}
        className="mt-5 w-full"
      >
        {outOfStock ? tProduct("outOfStock") : justAdded ? `✓ ${tCart("added")}` : tProduct("addToCart")}
      </Button>
    </div>
  );
}
