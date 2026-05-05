"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  slug: string;
  nameUk: string;
  nameEn: string;
  priceUah: number; // kopecks (snapshot at add time; refreshed via /api/cart/validate)
  imageUrl?: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.slug === item.slug);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.slug === item.slug ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      setQty: (slug, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.slug === slug ? { ...i, qty: Math.max(0, qty) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (slug) =>
        set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "ridne-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export const cartCount = (items: CartItem[]) =>
  items.reduce((acc, i) => acc + i.qty, 0);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((acc, i) => acc + i.priceUah * i.qty, 0);
