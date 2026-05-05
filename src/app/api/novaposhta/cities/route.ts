import { NextResponse } from "next/server";
import { searchCities } from "@/lib/novaposhta";
import { apiError } from "@/lib/apiError";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }
  try {
    const cities = await searchCities(q);
    return NextResponse.json({
      items: cities.map((c) => ({
        ref: c.Ref,
        name: c.MainDescription ?? c.Present ?? "",
        present: c.Present ?? "",
        area: c.Area ?? "",
        region: c.Region ?? "",
        warehouses: c.Warehouses ?? 0,
      })),
    });
  } catch (e) {
    return apiError("NP_UPSTREAM", (e as Error).message, 502);
  }
}
