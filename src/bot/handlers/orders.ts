import type { Context } from "grammy";
import { prisma } from "../../lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "⏳ Очікує",
  CONFIRMED: "✅ Підтверджено",
  PROCESSING: "📦 В обробці",
  SHIPPED: "🚚 Відправлено",
  DELIVERED: "🎉 Доставлено",
  CANCELLED: "❌ Скасовано",
  REFUNDED: "↩️ Повернуто",
};

function uah(kopecks: number): string {
  return `₴${(kopecks / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function onOrders(ctx: Context) {
  const user = ctx.from;
  if (!user) return;

  const customer = await prisma.customer.findUnique({
    where: { telegramId: String(user.id) },
    select: { id: true, phone: true, email: true },
  });
  if (!customer) {
    await ctx.reply("Спочатку натисніть /start, щоб ми вас впізнали 🙂");
    return;
  }

  // Match orders by direct link OR by phone/email (for orders placed on the web
  // before the customer linked Telegram).
  const orFilters: Array<Record<string, unknown>> = [{ customerId: customer.id }];
  if (customer.phone) orFilters.push({ phone: customer.phone });
  if (customer.email) orFilters.push({ email: customer.email });

  const orders = await prisma.order.findMany({
    where: { OR: orFilters },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      trackingNumber: true,
    },
  });

  if (orders.length === 0) {
    await ctx.reply(
      "У вас поки немає замовлень. Натисніть /catalog, щоб перейти до магазину.",
    );
    return;
  }

  const lines = orders.map((o) => {
    const date = new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
    }).format(o.createdAt);
    const status = STATUS_LABEL[o.status] ?? o.status;
    const tracking = o.trackingNumber ? `\n   ТТН: <code>${o.trackingNumber}</code>` : "";
    return `<b>${o.orderNumber}</b> · ${uah(o.total)}\n   ${status} · ${date}${tracking}`;
  });

  await ctx.reply(["<b>Останні замовлення:</b>", "", ...lines].join("\n\n"), {
    parse_mode: "HTML",
  });
}
