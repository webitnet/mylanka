import { publicBaseUrl } from "@/lib/payments/baseUrl";
import { tgEscape } from "./notify";

const SHIPPING_LABEL: Record<string, string> = {
  NOVA_POSHTA: "Нова Пошта",
  UKRPOSHTA: "Укрпошта",
  SELF_PICKUP: "Самовивіз",
  INTERNATIONAL: "Міжнар. доставка",
};

const PAYMENT_LABEL: Record<string, string> = {
  LIQPAY: "LiqPay",
  MONOBANK: "Monobank",
  CASH_ON_DELIVERY: "При отриманні",
};

function uah(kopecks: number): string {
  return `₴${(kopecks / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function newOrderMessage(input: {
  orderId: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  itemsCount: number;
  total: number;
  paymentMethod: "LIQPAY" | "MONOBANK" | "CASH_ON_DELIVERY";
  shippingMethod: "NOVA_POSHTA" | "UKRPOSHTA" | "SELF_PICKUP" | "INTERNATIONAL";
  npCity?: string | null;
  npWarehouse?: string | null;
  shippingAddress?: string | null;
}): string {
  const lines: string[] = [
    `🛒 <b>Нове замовлення</b>`,
    `<b>${tgEscape(input.orderNumber)}</b>`,
    "",
    `👤 ${tgEscape(`${input.firstName} ${input.lastName}`)}`,
    `📞 ${tgEscape(input.phone)}`,
    `📧 ${tgEscape(input.email)}`,
    "",
    `📦 ${input.itemsCount} ${pluralUk(input.itemsCount, "позиція", "позиції", "позицій")} · ${uah(input.total)}`,
    `💳 ${PAYMENT_LABEL[input.paymentMethod]}`,
  ];

  const shippingText = formatShipping(input);
  if (shippingText) lines.push(`🚚 ${tgEscape(shippingText)}`);

  const url = `${publicBaseUrl()}/admin/orders/${input.orderId}`;
  lines.push("", `<a href="${url}">Відкрити в адмінці →</a>`);

  return lines.join("\n");
}

export function paymentReceivedMessage(input: {
  orderNumber: string;
  provider: "LIQPAY" | "MONOBANK";
  amount: number;
}): string {
  return [
    `💰 <b>Оплата отримана</b>`,
    `<b>${tgEscape(input.orderNumber)}</b>`,
    `${PAYMENT_LABEL[input.provider]} — ${uah(input.amount)}`,
  ].join("\n");
}

function formatShipping(input: {
  shippingMethod: string;
  npCity?: string | null;
  npWarehouse?: string | null;
  shippingAddress?: string | null;
}): string | null {
  const base = SHIPPING_LABEL[input.shippingMethod] ?? input.shippingMethod;
  if (input.shippingMethod === "NOVA_POSHTA") {
    const parts = [base, input.npCity, input.npWarehouse].filter(Boolean);
    return parts.join(", ");
  }
  if (input.shippingAddress) return `${base}: ${input.shippingAddress}`;
  return base;
}

function pluralUk(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
