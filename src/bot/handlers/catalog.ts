import type { Context } from "grammy";
import { safeLinkUrl } from "../storeUrl";

export async function onCatalog(ctx: Context) {
  const productsUrl = safeLinkUrl("/products");
  const categoriesUrl = safeLinkUrl("/categories");

  if (productsUrl && categoriesUrl) {
    await ctx.reply("Відкрити каталог:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛍 Каталог Mylanka", url: productsUrl }],
          [{ text: "📂 Категорії", url: categoriesUrl }],
        ],
      },
    });
  } else {
    await ctx.reply(
      "Магазин ще не розгорнуто в продакшн. Слідкуйте за оновленнями — посилання з'явиться найближчим часом.",
    );
  }
}
