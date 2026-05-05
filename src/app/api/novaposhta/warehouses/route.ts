import { NextResponse } from "next/server";
import { listWarehouses } from "@/lib/novaposhta";
import { apiError } from "@/lib/apiError";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const settlementRef = url.searchParams.get("settlementRef") ?? url.searchParams.get("cityRef") ?? "";
  if (!settlementRef) {
    return apiError("MISSING_CITY", "settlementRef is required", 400);
  }
  try {
    const warehouses = await listWarehouses(settlementRef);
    return NextResponse.json({
      items: warehouses.map((w) => ({
        ref: w.Ref,
        number: w.Number,
        description: w.Description,
        shortAddress: w.ShortAddress,
        category: w.CategoryOfWarehouse,
      })),
    });
  } catch (e) {
    return apiError("NP_UPSTREAM", (e as Error).message, 502);
  }
}
