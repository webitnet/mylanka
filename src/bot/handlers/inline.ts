import type { Context } from "grammy";
import type { InlineQueryResult } from "grammy/types";
import { prisma } from "../../lib/prisma";
import { safeLinkUrl } from "../storeUrl";

/**
 * Inline-mode product search. Users type `@mylanka_shop_bot keyword`
 * anywhere; results render as a list of products with thumbnails and
 * resolve to a shareable message linking back to the storefront.
 *
 * To enable: @BotFather → /setinline → set a placeholder.
 */
export async function onInlineQuery(ctx: Context) {
  const q = ctx.inlineQuery?.query.trim() ?? "";

  // Empty query → show 5 featured products as suggestions.
  const where = q.length >= 2
    ? {
        isActive: true,
        OR: [
          { nameUk: { contains: q, mode: "insensitive" as const } },
          { nameEn: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { isActive: true, isFeatured: true };

  const products = await prisma.product.findMany({
    where,
    take: 20,
    orderBy: q.length >= 2
      ? [{ isFeatured: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      nameUk: true,
      priceUah: true,
      shortDescUk: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  const results: InlineQueryResult[] = products
    .map((p): InlineQueryResult | null => {
      const productUrl = safeLinkUrl(`/products/${p.slug}`);
      if (!productUrl) return null; // Telegram requires HTTPS for inline results

      const priceUah = (p.priceUah / 100).toLocaleString("uk-UA");
      const messageText = [
        `<b>${escapeHtml(p.nameUk)}</b>`,
        `₴${priceUah}`,
        productUrl,
      ].join("\n");

      const thumb = p.images[0]?.url;
      return {
        type: "article",
        id: p.id,
        title: p.nameUk,
        description: `₴${priceUah}${p.shortDescUk ? ` · ${truncate(p.shortDescUk, 60)}` : ""}`,
        ...(thumb ? { thumbnail_url: thumb } : {}),
        input_message_content: {
          message_text: messageText,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: false },
        },
      };
    })
    .filter((x): x is InlineQueryResult => x !== null);

  await ctx.answerInlineQuery(results, {
    cache_time: 60,
    is_personal: false,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
