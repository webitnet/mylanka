import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDashboardStats,
  getLowStockProducts,
  getRecentOrders,
  type LowStockProduct,
  type RecentOrder,
} from "@/lib/admin/dashboard";
import { formatUah } from "@/lib/utils";

export const metadata = { title: "Дашборд" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [session, stats, recentOrders, lowStock] = await Promise.all([
    getServerSession(authOptions),
    getDashboardStats(),
    getRecentOrders(10),
    getLowStockProducts(10),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-brass">
          Дашборд
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic text-bark">
          Вітаємо, {session?.user.name}
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Замовлення сьогодні" value={String(stats.ordersToday)} />
        <StatCard
          title="Виторг сьогодні"
          value={formatUah(stats.revenueTodayKopecks, "uk")}
        />
        <StatCard
          title="Очікують обробки"
          value={String(stats.pendingOrders)}
          accent={stats.pendingOrders > 0}
        />
        <StatCard
          title="Низький залишок"
          value={String(stats.lowStockCount)}
          accent={stats.lowStockCount > 0}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Останні замовлення" linkLabel="Усі замовлення" linkHref="/admin/orders">
          {recentOrders.length === 0 ? (
            <Empty>Поки немає замовлень.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <RecentOrderRow key={o.id} order={o} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Низький залишок" linkLabel="Усі товари" linkHref="/admin/products">
          {lowStock.length === 0 ? (
            <Empty>Усі позиції мають достатньо залишку.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((p) => (
                <LowStockRow key={p.id} product={p} />
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-sm border p-5 ${
        accent ? "border-embroidery/50 bg-embroidery/5" : "border-border bg-linen/40"
      }`}
    >
      <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
        {title}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-3xl ${
          accent ? "text-embroidery" : "text-bark"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  linkLabel,
  linkHref,
  children,
}: {
  title: string;
  linkLabel: string;
  linkHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-border bg-linen/30">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
          {title}
        </h2>
        <Link
          href={linkHref}
          className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted hover:text-embroidery"
        >
          {linkLabel} →
        </Link>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted">{children}</p>;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Очікує",
  CONFIRMED: "Підтверджено",
  PROCESSING: "В обробці",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  CANCELLED: "Скасовано",
  REFUNDED: "Повернуто",
};

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Не оплачено",
  PENDING: "Очікує",
  PAID: "Оплачено",
  PARTIALLY_REFUNDED: "Частк. повернення",
  REFUNDED: "Повернуто",
  FAILED: "Помилка",
};

function RecentOrderRow({ order }: { order: RecentOrder }) {
  const date = new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.createdAt);
  const accent = order.status === "PENDING";
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <div className="min-w-0">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-bark hover:text-embroidery"
        >
          {order.orderNumber}
        </Link>
        <p className="truncate text-xs text-muted">
          {order.customerName} · {date}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span className="text-bark">{formatUah(order.total, "uk")}</span>
        <span
          className={`font-[family-name:var(--font-ui)] text-[9px] uppercase tracking-wider ${
            accent ? "text-embroidery" : "text-muted"
          }`}
        >
          {STATUS_LABEL[order.status] ?? order.status} ·{" "}
          {PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus}
        </span>
      </div>
    </li>
  );
}

function LowStockRow({ product }: { product: LowStockProduct }) {
  const critical = product.stock === 0;
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <Link
        href={`/admin/products/${product.id}`}
        className="min-w-0 flex-1 truncate text-bark hover:text-embroidery"
      >
        {product.nameUk}
      </Link>
      <span
        className={`font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider ${
          critical ? "text-embroidery" : "text-brass"
        }`}
      >
        {product.stock} / {product.lowStockAt}
      </span>
    </li>
  );
}
