import { tgEscape } from "./notify";

const PROVIDER_LABEL: Record<string, string> = {
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

export function orderConfirmedMessage(input: {
  orderNumber: string;
  total: number;
}): string {
  return [
    `✅ <b>Замовлення підтверджено</b>`,
    `<b>${tgEscape(input.orderNumber)}</b> · ${uah(input.total)}`,
    ``,
    `Дякуємо! Готуємо ваше замовлення до відправки.`,
  ].join("\n");
}

export function orderShippedMessage(input: {
  orderNumber: string;
  trackingNumber: string;
  shippingMethod: string;
}): string {
  const lines: string[] = [
    `📦 <b>Замовлення відправлено</b>`,
    `<b>${tgEscape(input.orderNumber)}</b>`,
    ``,
    `ТТН: <code>${tgEscape(input.trackingNumber)}</code>`,
  ];
  if (input.shippingMethod === "NOVA_POSHTA") {
    lines.push(
      `\n<a href="https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(input.trackingNumber)}">Відстежити →</a>`,
    );
  }
  return lines.join("\n");
}

export function orderDeliveredMessage(input: { orderNumber: string }): string {
  return [
    `🎉 <b>Замовлення доставлено</b>`,
    `<b>${tgEscape(input.orderNumber)}</b>`,
    ``,
    `Дякуємо за покупку! Поділіться враженнями — будемо вдячні за відгук.`,
  ].join("\n");
}

export function orderCancelledMessage(input: { orderNumber: string }): string {
  return [
    `❌ <b>Замовлення скасовано</b>`,
    `<b>${tgEscape(input.orderNumber)}</b>`,
    ``,
    `Якщо це непорозуміння — напишіть нам у /help.`,
  ].join("\n");
}

export function orderRefundedMessage(input: {
  orderNumber: string;
  total: number;
}): string {
  return [
    `↩️ <b>Оформлене повернення</b>`,
    `<b>${tgEscape(input.orderNumber)}</b> · ${uah(input.total)}`,
    ``,
    `Кошти повертаються через банк-провайдер. Може зайняти 1–5 робочих днів.`,
  ].join("\n");
}

export function paymentMethodLabel(method: string): string {
  return PROVIDER_LABEL[method] ?? method;
}
