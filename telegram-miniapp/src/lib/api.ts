export type ProductListItem = {
  slug: string;
  nameUk: string;
  nameEn: string;
  priceUah: number; // kopecks
  comparePrice: number | null;
  stock: number;
  trackStock: boolean;
  image: string | null;
  categorySlug: string;
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type ProductDetail = {
  slug: string;
  sku: string;
  nameUk: string;
  nameEn: string;
  descUk: string;
  descEn: string;
  shortDescUk: string | null;
  shortDescEn: string | null;
  priceUah: number;
  comparePrice: number | null;
  stock: number;
  trackStock: boolean;
  material: string | null;
  artisan: string | null;
  region: string | null;
  weight: number | null;
  dimensions: string | null;
  images: { url: string; altUk: string | null; altEn: string | null }[];
  category: { slug: string; nameUk: string; nameEn: string };
};

export type CheckoutBody = {
  contact: { firstName: string; lastName: string; email: string; phone: string };
  shipping:
    | { method: "NOVA_POSHTA"; cityName: string; warehouseDescription: string }
    | { method: "UKRPOSHTA"; address: string }
    | { method: "SELF_PICKUP" }
    | { method: "INTERNATIONAL"; address: string };
  payment: "MONOBANK" | "CASH_ON_DELIVERY";
  items: { slug: string; qty: number }[];
  notes?: string;
  locale?: "uk" | "en";
};

export type Customer = {
  id: string;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  locale: string;
};

let initDataCache = "";

/** Set by App on mount so subsequent fetches can attach the auth header. */
export function setInitData(initData: string) {
  initDataCache = initData;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(initDataCache ? { "x-telegram-init-data": initDataCache } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function authenticate(): Promise<Customer> {
  const data = await api<{ customer: Customer }>("/api/telegram/auth", {
    method: "POST",
    body: JSON.stringify({ initData: initDataCache }),
  });
  return data.customer;
}

export async function listProducts(params: {
  q?: string;
  category?: string;
  page?: number;
} = {}): Promise<ProductListResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.page) qs.set("page", String(params.page));
  return api<ProductListResponse>(`/api/products?${qs.toString()}`);
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  return api<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
}

export type NpCity = { ref: string; name: string };
export type NpWarehouse = { ref: string; description: string; number: string };

export async function searchCities(q: string): Promise<NpCity[]> {
  const qs = new URLSearchParams({ q });
  const data = await api<{ items: NpCity[] }>(
    `/api/novaposhta/cities?${qs.toString()}`,
  );
  return data.items;
}

export async function listWarehouses(cityRef: string): Promise<NpWarehouse[]> {
  const qs = new URLSearchParams({ settlementRef: cityRef });
  const data = await api<{ items: NpWarehouse[] }>(
    `/api/novaposhta/warehouses?${qs.toString()}`,
  );
  return data.items;
}

export async function submitCheckout(
  body: CheckoutBody,
): Promise<{ orderNumber: string }> {
  return api<{ orderNumber: string }>(`/api/checkout`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createMonoPayment(
  orderNumber: string,
): Promise<{ redirectUrl: string }> {
  return api<{ redirectUrl: string }>(`/api/payments/mono/create`, {
    method: "POST",
    body: JSON.stringify({ orderNumber, locale: "uk" }),
  });
}
