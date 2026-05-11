import { useCallback, useEffect, useState } from "react";

const KEY = "mylanka-mini-cart-v1";

export type CartItem = {
  slug: string;
  nameUk: string;
  priceUah: number; // kopecks
  image: string | null;
  qty: number;
  stock: number; // last-known
};

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("mylanka:cart"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());

  useEffect(() => {
    const onChange = () => setItems(read());
    window.addEventListener("mylanka:cart", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("mylanka:cart", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((item: Omit<CartItem, "qty"> & { qty?: number }) => {
    const current = read();
    const existing = current.find((i) => i.slug === item.slug);
    const addQty = item.qty ?? 1;
    let next: CartItem[];
    if (existing) {
      next = current.map((i) =>
        i.slug === item.slug
          ? { ...i, qty: clampQty(i.qty + addQty, item.stock) }
          : i,
      );
    } else {
      next = [...current, { ...item, qty: clampQty(addQty, item.stock) }];
    }
    write(next);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const current = read();
    const item = current.find((i) => i.slug === slug);
    if (!item) return;
    if (qty <= 0) {
      write(current.filter((i) => i.slug !== slug));
    } else {
      write(
        current.map((i) =>
          i.slug === slug ? { ...i, qty: clampQty(qty, i.stock) } : i,
        ),
      );
    }
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => write([]), []);

  const count = items.reduce((a, b) => a + b.qty, 0);
  const subtotal = items.reduce((a, b) => a + b.priceUah * b.qty, 0);

  return { items, add, setQty, remove, clear, count, subtotal };
}

function clampQty(q: number, stock: number): number {
  return Math.max(1, Math.min(q, stock || 1));
}
