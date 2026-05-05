/**
 * Nova Poshta API v2.0 client.
 * Docs: https://developers.novaposhta.ua/documentation
 */

const ENDPOINT = "https://api.novaposhta.ua/v2.0/json/";

type NPResponse<T> = {
  success: boolean;
  data: T[];
  errors?: string[];
  warnings?: string[];
  info?: unknown;
  messageCodes?: string[];
  errorCodes?: string[];
};

async function call<T>(modelName: string, calledMethod: string, methodProperties: Record<string, unknown> = {}): Promise<T[]> {
  const apiKey = process.env.NOVAPOSHTA_API_KEY;
  if (!apiKey) throw new Error("NOVAPOSHTA_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
    // Nova Poshta data is stable over hours, cache for 5 min
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Nova Poshta HTTP ${res.status}`);
  const json = (await res.json()) as NPResponse<T>;
  if (!json.success) {
    throw new Error(`Nova Poshta error: ${json.errors?.join(", ") ?? "unknown"}`);
  }
  return json.data;
}

export type NPSettlement = {
  Ref: string;
  Present?: string; // "м. Київ, Київська обл."
  MainDescription?: string; // "Київ"
  Area?: string;
  Region?: string;
  SettlementTypeCode?: string;
  Warehouses?: number;
};

export type NPWarehouse = {
  Ref: string;
  Description: string;
  ShortAddress?: string;
  CityRef: string;
  CityDescription: string;
  Number?: string;
  CategoryOfWarehouse?: string;
};

export async function searchCities(query: string, limit = 20) {
  const q = query?.trim() ?? "";
  if (q.length < 2) return [];
  // NP API only accepts Cyrillic; quietly return empty for Latin/other input.
  if (!/[Ѐ-ӿ]/.test(q)) return [];
  type Container = { TotalCount: number; Addresses: NPSettlement[] };
  const data = await call<Container>("Address", "searchSettlements", {
    CityName: q,
    Limit: String(limit),
  });
  return data[0]?.Addresses ?? [];
}

export async function listWarehouses(settlementRef: string, page = 1) {
  if (!settlementRef) return [];
  return call<NPWarehouse>("AddressGeneral", "getWarehouses", {
    SettlementRef: settlementRef,
    Page: String(page),
    Limit: "200",
  });
}
