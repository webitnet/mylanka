"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import {
  cartSubtotal,
  useCartStore,
  type CartItem,
} from "@/lib/cart/store";
import { useHydrated } from "@/lib/cart/useHydrated";
import { formatUah } from "@/lib/utils";
import type { CartValidateResponse } from "@/app/api/cart/validate/route";

export function CartView() {
  const locale = useLocale() as "uk" | "en";
  const t = useTranslations("Cart");
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const hydrated = useHydrated();

  const [stockBySlug, setStockBySlug] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setStockBySlug({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as CartValidateResponse;
        if (cancelled) return;

        const stockMap: Record<string, number> = {};
        let priceChanged = false;
        let stockReduced = false;
        const removedSet = new Set(data.removed);

        for (const v of data.items) {
          stockMap[v.slug] = v.stock;
          const local = items.find((i) => i.slug === v.slug);
          if (!local) continue;
          if (local.priceUah !== v.priceUah) priceChanged = true;
          if (v.grantedQty < v.requestedQty) {
            stockReduced = true;
            setQty(v.slug, v.grantedQty);
          }
        }

        for (const slug of removedSet) {
          remove(slug);
        }

        setStockBySlug(stockMap);
        if (removedSet.size > 0) setNotice(t("outOfStock"));
        else if (stockReduced) setNotice(t("stockExceeded", { n: 0 }).replace("0", ""));
        else if (priceChanged) setNotice(t("priceChanged"));
        else setNotice(null);
      } catch {
        // network error — skip silently
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) {
    return <div className="py-10 text-center text-muted">…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-base text-muted">{t("empty")}</p>
        <div className="mt-6">
          <Link href="/products">
            <Button>{t("continueShopping")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0">
        {notice && (
          <div className="mb-4 rounded-sm border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-bark">
            {notice}
          </div>
        )}
        <ul className="divide-y divide-border border-y border-border">
          {items.map((it) => (
            <CartRow
              key={it.slug}
              item={it}
              stock={stockBySlug[it.slug]}
              onChangeQty={(q) => setQty(it.slug, q)}
              onRemove={() => remove(it.slug)}
              locale={locale}
            />
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-sm border border-border bg-cream/60 p-6">
        <Row label={t("subtotal")} value={formatUah(subtotal, locale)} />
        <Row label={t("shipping")} value={t("shippingNote")} muted />
        <div className="mt-3 border-t border-border pt-3">
          <Row label={t("total")} value={formatUah(subtotal, locale)} bold />
        </div>
        <Link href="/checkout" className="mt-5 block">
          <Button size="lg" className="w-full">
            {t("checkout")}
          </Button>
        </Link>
        <Link href="/products" className="mt-3 block">
          <Button size="md" variant="secondary" className="w-full">
            {t("continueShopping")}
          </Button>
        </Link>
      </aside>
    </div>
  );
}

function CartRow({
  item,
  stock,
  onChangeQty,
  onRemove,
  locale,
}: {
  item: CartItem;
  stock?: number;
  onChangeQty: (q: number) => void;
  onRemove: () => void;
  locale: "uk" | "en";
}) {
  const t = useTranslations("Cart");
  const name = locale === "uk" ? item.nameUk : item.nameEn;
  const max = stock ?? 99;
  return (
    <li className="flex gap-4 py-4">
      <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-sm bg-wheat">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={name} fill sizes="80px" className="object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${item.slug}`}
            className="text-sm text-bark hover:text-terracotta transition"
          >
            {name}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted hover:text-terracotta transition"
            aria-label={t("remove")}
          >
            {t("remove")}
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="inline-flex items-center rounded-sm border border-border">
            <button
              type="button"
              disabled={item.qty <= 1}
              onClick={() => onChangeQty(item.qty - 1)}
              className="px-2.5 py-1 text-bark disabled:opacity-40"
              aria-label="-"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.qty}</span>
            <button
              type="button"
              disabled={item.qty >= max}
              onClick={() => onChangeQty(item.qty + 1)}
              className="px-2.5 py-1 text-bark disabled:opacity-40"
              aria-label="+"
            >
              +
            </button>
          </div>
          <span className="font-[family-name:var(--font-display)] text-base text-bark">
            {formatUah(item.priceUah * item.qty, locale)}
          </span>
        </div>
      </div>
    </li>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={muted ? "text-muted" : "text-bark"}>{label}</span>
      <span
        className={
          bold
            ? "font-[family-name:var(--font-display)] text-lg text-bark"
            : muted
              ? "text-muted"
              : "text-bark"
        }
      >
        {value}
      </span>
    </div>
  );
}
