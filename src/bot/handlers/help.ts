import type { Context } from "grammy";
import { safeLinkUrl } from "../storeUrl";

export async function onHelp(ctx: Context) {
  const contactUrl = safeLinkUrl("/contact");
  const lines = [
    "<b>Mylanka — Миланка</b>",
    "Вишиванки · Сувеніри · Обереги",
    "",
    "<b>Команди:</b>",
    "/start — почати спочатку",
    "/catalog — перейти до каталогу",
    "/orders — мої замовлення",
    "/help — ця довідка",
    "",
    "<b>Доставка:</b>",
    "🚚 Нова Пошта по всій Україні",
    "🌍 Міжнародна доставка за домовленістю",
    "",
    "<b>Оплата:</b>",
    "💳 Картка через Monobank",
    "💵 При отриманні",
  ];
  if (contactUrl) {
    lines.push("", `<a href="${contactUrl}">Зв'язатись з нами →</a>`);
  }
  await ctx.reply(lines.join("\n"), {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}
