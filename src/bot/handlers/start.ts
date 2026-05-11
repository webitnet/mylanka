import type { Context } from "grammy";
import { prisma } from "../../lib/prisma";
import { safeLinkUrl } from "../storeUrl";

export async function onStart(ctx: Context) {
  const user = ctx.from;
  if (!user) return;

  // Upsert Customer by telegramId, capture name/locale snapshot.
  const telegramId = String(user.id);
  const locale = user.language_code?.startsWith("uk") ? "uk" : "en";
  await prisma.customer.upsert({
    where: { telegramId },
    update: {
      firstName: user.first_name ?? undefined,
      lastName: user.last_name ?? undefined,
    },
    create: {
      telegramId,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      locale,
    },
  });

  const greeting = user.first_name ? `Вітаємо, ${user.first_name}! 🇺🇦` : "Вітаємо! 🇺🇦";
  const shopUrl = safeLinkUrl("/");

  const text = [
    greeting,
    "",
    "<b>Mylanka — Миланка</b>",
    "Вишиванки · Сувеніри · Обереги",
    "",
    shopUrl
      ? "Натисніть кнопку нижче, щоб відкрити магазин, або скористайтесь командами:"
      : "Скористайтесь командами:",
    "/catalog — перейти до каталогу",
    "/orders — мої замовлення",
    "/help — допомога та контакти",
  ].join("\n");

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: shopUrl
      ? { inline_keyboard: [[{ text: "🛍 Відкрити магазин", url: shopUrl }]] }
      : undefined,
  });
}
