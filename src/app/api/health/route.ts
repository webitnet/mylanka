import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lightweight health probe for uptime monitoring (BetterStack / UptimeRobot).
 * Verifies the DB connection is alive; returns 503 if unreachable.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        latencyMs: Date.now() - startedAt,
        time: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        error: (err as Error).message,
        time: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
