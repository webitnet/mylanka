import { prisma } from "@/lib/prisma";

function startOfTodayUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export type DashboardStats = {
  ordersToday: number;
  revenueTodayKopecks: number;
  pendingOrders: number;
  lowStockCount: number;
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
};

export type LowStockProduct = {
  id: string;
  slug: string;
  nameUk: string;
  stock: number;
  lowStockAt: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = startOfTodayUtc();

  const [ordersToday, revenueAgg, pendingOrders, lowStockCount] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: since },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: "PENDING" },
    }),
    prisma.product.count({
      where: {
        trackStock: true,
        stock: { lte: prisma.product.fields.lowStockAt },
      },
    }),
  ]);

  return {
    ordersToday,
    revenueTodayKopecks: revenueAgg._sum.total ?? 0,
    pendingOrders,
    lowStockCount,
  };
}

export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      firstName: true,
      lastName: true,
      total: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
    },
  });
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: `${o.firstName} ${o.lastName}`.trim(),
    total: o.total,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
  }));
}

export async function getLowStockProducts(limit = 10): Promise<LowStockProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      trackStock: true,
      stock: { lte: prisma.product.fields.lowStockAt },
    },
    orderBy: { stock: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      nameUk: true,
      stock: true,
      lowStockAt: true,
    },
  });
  return rows;
}
