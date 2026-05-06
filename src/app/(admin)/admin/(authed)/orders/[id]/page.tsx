import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelOrder,
  confirmOrder,
  getOrderForAdmin,
  markDelivered,
  markProcessing,
  refundOrder,
  shipOrder,
  updateAdminNotes,
} from "@/lib/admin/orders";
import { formatUah } from "@/lib/utils";

export const metadata = { title: "Замовлення" };
export const dynamic = "force-dynamic";

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

const SHIPPING_LABEL: Record<string, string> = {
  NOVA_POSHTA: "Нова Пошта",
  UKRPOSHTA: "Укрпошта",
  SELF_PICKUP: "Самовивіз",
  INTERNATIONAL: "Міжнар. доставка",
};

const PROVIDER_LABEL: Record<string, string> = {
  LIQPAY: "LiqPay",
  MONOBANK: "Monobank",
  CASH_ON_DELIVERY: "При отриманні",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  const date = new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.createdAt);

  // Bound server actions for this order
  const confirmAction = async () => {
    "use server";
    await confirmOrder(id);
  };
  const processingAction = async () => {
    "use server";
    await markProcessing(id);
  };
  const deliveredAction = async () => {
    "use server";
    await markDelivered(id);
  };
  const cancelAction = async () => {
    "use server";
    await cancelOrder(id);
  };
  const refundAction = async () => {
    "use server";
    await refundOrder(id);
  };
  const shipAction = async (fd: FormData) => {
    "use server";
    const tracking = String(fd.get("trackingNumber") ?? "");
    await shipOrder(id, tracking);
  };
  const notesAction = async (fd: FormData) => {
    "use server";
    const notes = String(fd.get("adminNotes") ?? "");
    await updateAdminNotes(id, notes);
  };

  const isTerminal = order.status === "CANCELLED" || order.status === "REFUNDED";
  const canConfirm = order.status === "PENDING";
  const canProcess = order.status === "CONFIRMED";
  const canShip = order.status === "CONFIRMED" || order.status === "PROCESSING";
  const canDeliver = order.status === "SHIPPED";
  const canRefund =
    !isTerminal && order.paymentStatus === "PAID";

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/orders"
          className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted hover:text-bark"
        >
          ← Усі замовлення
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl italic text-bark">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-muted">{date}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-sm bg-bark/10 px-3 py-1 text-xs text-bark">
              {STATUS_LABEL[order.status]}
            </span>
            <span className="rounded-sm bg-bark/10 px-3 py-1 text-xs text-bark">
              {PAYMENT_LABEL[order.paymentStatus]}
            </span>
          </div>
        </div>
      </header>

      {/* Actions */}
      {!isTerminal && (
        <section className="rounded-sm border border-border bg-linen/30 p-5">
          <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
            Дії
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            {canConfirm && (
              <ActionButton action={confirmAction} label="Підтвердити" />
            )}
            {canProcess && (
              <ActionButton action={processingAction} label="В обробку" />
            )}
            {canShip && (
              <form action={shipAction} className="flex items-end gap-2">
                <label className="block">
                  <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
                    Трек-номер
                  </span>
                  <input
                    name="trackingNumber"
                    required
                    defaultValue={order.trackingNumber ?? ""}
                    className="input mt-1"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-sm bg-bark px-4 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-parchment hover:bg-embroidery"
                >
                  Відправити
                </button>
              </form>
            )}
            {canDeliver && (
              <ActionButton action={deliveredAction} label="Доставлено" />
            )}
            <ActionButton
              action={cancelAction}
              label="Скасувати"
              variant="danger"
            />
            {canRefund && (
              <ActionButton
                action={refundAction}
                label="Оформити повернення"
                variant="danger"
              />
            )}
          </div>
          {canRefund && (
            <p className="mt-3 text-xs text-muted">
              Повернення коштів виконується вручну в кабінеті провайдера. Кнопка
              лише фіксує статус і повертає товари на склад.
            </p>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Items */}
        <section className="rounded-sm border border-border bg-linen/30">
          <h2 className="border-b border-border px-5 py-3 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
            Позиції ({order.items.length})
          </h2>
          <ul className="divide-y divide-border">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-start gap-4 px-5 py-4">
                {it.product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.product.images[0].url}
                    alt={it.nameUk}
                    className="h-14 w-14 rounded-sm border border-border object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-sm border border-border bg-parchment" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${it.product.id}`}
                    className="text-bark hover:text-embroidery"
                  >
                    {it.nameUk}
                  </Link>
                  <p className="font-mono text-xs text-muted">
                    SKU: {it.sku} · ×{it.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-bark">{formatUah(it.total, "uk")}</p>
                  <p className="text-xs text-muted">{formatUah(it.priceUah, "uk")} / шт.</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-border px-5 py-4 text-sm">
            <Row label="Підсумок" value={formatUah(order.subtotal, "uk")} />
            {order.shippingCost > 0 && (
              <Row label="Доставка" value={formatUah(order.shippingCost, "uk")} />
            )}
            {order.discount > 0 && (
              <Row label="Знижка" value={`− ${formatUah(order.discount, "uk")}`} />
            )}
            <div className="flex justify-between border-t border-border pt-2 font-[family-name:var(--font-display)] text-lg text-bark">
              <span>Усього</span>
              <span>{formatUah(order.total, "uk")}</span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-sm border border-border bg-linen/30 p-5">
            <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
              Клієнт
            </h2>
            <dl className="mt-3 space-y-1 text-sm">
              <KV k="Імʼя" v={`${order.firstName} ${order.lastName}`} />
              <KV k="Email" v={order.email} />
              <KV k="Телефон" v={order.phone} />
            </dl>
          </section>

          {/* Shipping */}
          <section className="rounded-sm border border-border bg-linen/30 p-5">
            <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
              Доставка
            </h2>
            <dl className="mt-3 space-y-1 text-sm">
              <KV k="Метод" v={SHIPPING_LABEL[order.shippingMethod] ?? order.shippingMethod} />
              {order.shippingMethod === "NOVA_POSHTA" && (
                <>
                  {order.npCity && <KV k="Місто" v={order.npCity} />}
                  {order.npWarehouse && <KV k="Відділення" v={order.npWarehouse} />}
                </>
              )}
              {order.shippingAddress && <KV k="Адреса" v={order.shippingAddress} />}
              {order.trackingNumber && (
                <KV k="Трек" v={<span className="font-mono">{order.trackingNumber}</span>} />
              )}
            </dl>
          </section>

          {/* Payments */}
          <section className="rounded-sm border border-border bg-linen/30 p-5">
            <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
              Платежі
            </h2>
            {order.payments.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Платежів ще не зафіксовано.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="rounded-sm border border-border bg-parchment/50 p-3">
                    <p className="text-bark">
                      {PROVIDER_LABEL[p.provider] ?? p.provider} · {formatUah(p.amount, "uk")}
                    </p>
                    <p className="text-xs text-muted">
                      {PAYMENT_LABEL[p.status] ?? p.status}
                      {p.paidAt && ` · оплачено ${new Date(p.paidAt).toLocaleString("uk-UA")}`}
                    </p>
                    {p.externalId && (
                      <p className="font-mono text-[11px] text-muted">id: {p.externalId}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Customer notes (read-only) */}
          {order.notes && (
            <section className="rounded-sm border border-border bg-linen/30 p-5">
              <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
                Коментар клієнта
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-bark">{order.notes}</p>
            </section>
          )}

          {/* Admin notes */}
          <section className="rounded-sm border border-border bg-linen/30 p-5">
            <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
              Внутрішні нотатки
            </h2>
            <form action={notesAction} className="mt-3 space-y-3">
              <textarea
                name="adminNotes"
                rows={4}
                defaultValue={order.adminNotes ?? ""}
                className="input"
              />
              <button
                type="submit"
                className="rounded-sm border border-bark px-4 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-bark hover:bg-bark hover:text-parchment"
              >
                Зберегти нотатки
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  label,
  variant,
}: {
  action: () => Promise<void>;
  label: string;
  variant?: "danger";
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded-sm px-4 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider transition ${
          variant === "danger"
            ? "border border-embroidery text-embroidery hover:bg-embroidery hover:text-parchment"
            : "bg-bark text-parchment hover:bg-embroidery"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-bark">{value}</span>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="min-w-0 text-right text-bark">{v}</dd>
    </div>
  );
}
