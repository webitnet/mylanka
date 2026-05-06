import { prisma } from "./prisma";

/**
 * Generates the next order number in RDN-YYYYMMDD-NNN format.
 * Counts orders created today (UTC date boundaries) and increments.
 *
 * Note: Not strictly atomic — under high concurrency two requests in the same
 * millisecond could collide. The Order.orderNumber unique constraint will
 * surface that as a P2002 error; callers should retry once on collision.
 */
export async function generateOrderNumber(now: Date = new Date()): Promise<string> {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;

  const start = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const todayCount = await prisma.order.count({
    where: { createdAt: { gte: start, lt: end } },
  });
  const seq = String(todayCount + 1).padStart(3, "0");
  return `MLN-${datePart}-${seq}`;
}
