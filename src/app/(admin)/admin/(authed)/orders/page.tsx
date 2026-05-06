import Link from "next/link";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { listOrdersForAdmin } from "@/lib/admin/orders";
import { formatUah } from "@/lib/utils";

export const metadata = { title: "Замовлення" };
export const dynamic = "force-dynamic";

type SP = Promise<{
  q?: string;
  status?: string;
  payment?: string;
  page?: string;
}>;

const STATUS_OPTIONS: { v: "all" | OrderStatus; label: string }[] = [
  { v: "all", label: "Усі статуси" },
  { v: "PENDING", label: "Очікує" },
  { v: "CONFIRMED", label: "Підтверджено" },
  { v: "PROCESSING", label: "В обробці" },
  { v: "SHIPPED", label: "Відправлено" },
  { v: "DELIVERED", label: "Доставлено" },
  { v: "CANCELLED", label: "Скасовано" },
  { v: "REFUNDED", label: "Повернуто" },
];

const PAYMENT_OPTIONS: { v: "all" | PaymentStatus; label: string }[] = [
  { v: "all", label: "Будь-яка оплата" },
  { v: "UNPAID", label: "Не оплачено" },
  { v: "PENDING", label: "Очікує оплати" },
  { v: "PAID", label: "Оплачено" },
  { v: "FAILED", label: "Помилка оплати" },
  { v: "REFUNDED", label: "Повернуто" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.filter((o) => o.v !== "all").map((o) => [o.v, o.label]),
);
const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_OPTIONS.filter((o) => o.v !== "all").map((o) => [o.v, o.label]),
);

const SOURCE_LABEL: Record<string, string> = {
  WEB: "Сайт",
  TELEGRAM: "Telegram",
  INSTAGRAM: "Instagram",
  PROM_UA: "Prom.ua",
  ROZETKA: "Rozetka",
  OTHER: "Інше",
};

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = (sp.status as "all" | OrderStatus) ?? "all";
  const paymentStatus = (sp.payment as "all" | PaymentStatus) ?? "all";
  const page = Number(sp.page ?? "1") || 1;

  const { items, total, pageCount } = await listOrdersForAdmin({
    q,
    status,
    paymentStatus,
    page,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-brass">
          Замовлення
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic text-bark">
          Усі замовлення
        </h1>
        <p className="mt-1 text-sm text-muted">Всього: {total}</p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-sm border border-border bg-linen/30 p-4 md:grid-cols-[2fr_1.2fr_1.2fr_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Пошук: номер, ім'я, email, телефон"
          className="input"
        />
        <select name="status" defaultValue={status} className="input">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>{o.label}</option>
          ))}
        </select>
        <select name="payment" defaultValue={paymentStatus} className="input">
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-bark px-4 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-bark hover:bg-bark hover:text-parchment"
        >
          Застосувати
        </button>
      </form>

      <div className="overflow-hidden rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-linen/40 text-left">
            <tr className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Клієнт</th>
              <th className="px-4 py-3 text-right">Позицій</th>
              <th className="px-4 py-3 text-right">Сума</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Оплата</th>
              <th className="px-4 py-3">Канал</th>
              <th className="px-4 py-3">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted">
                  Замовлень за фільтром не знайдено
                </td>
              </tr>
            )}
            {items.map((o) => {
              const date = new Intl.DateTimeFormat("uk-UA", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(o.createdAt);
              const pendingAccent = o.status === "PENDING";
              return (
                <tr key={o.id} className="hover:bg-linen/40">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-xs font-medium text-bark hover:text-embroidery"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-bark">{o.firstName} {o.lastName}</p>
                    <p className="truncate text-xs text-muted">{o.email}</p>
                  </td>
                  <td className="px-4 py-2 text-right text-muted">{o._count.items}</td>
                  <td className="px-4 py-2 text-right text-bark">{formatUah(o.total, "uk")}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs ${
                        pendingAccent ? "bg-embroidery/15 text-embroidery" : "bg-muted/15 text-muted"
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs ${
                        o.paymentStatus === "PAID"
                          ? "bg-olive/15 text-olive"
                          : o.paymentStatus === "FAILED"
                            ? "bg-embroidery/15 text-embroidery"
                            : "bg-muted/15 text-muted"
                      }`}
                    >
                      {PAYMENT_LABEL[o.paymentStatus] ?? o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted">
                    {SOURCE_LABEL[o.source] ?? o.source}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted">{date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          query={{ q, status, payment: paymentStatus }}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  query,
}: {
  page: number;
  pageCount: number;
  query: Record<string, string>;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v);
    });
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <nav className="flex justify-center gap-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className="rounded-sm border border-border px-3 py-2 text-bark hover:border-bark">
          ← Назад
        </Link>
      )}
      <span className="px-3 py-2 text-muted">Сторінка {page} з {pageCount}</span>
      {page < pageCount && (
        <Link href={buildHref(page + 1)} className="rounded-sm border border-border px-3 py-2 text-bark hover:border-bark">
          Далі →
        </Link>
      )}
    </nav>
  );
}
