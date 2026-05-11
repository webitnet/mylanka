/**
 * Mylanka customer-facing Telegram bot.
 * Polling mode for development; switch to webhook in production
 * (see docs/PHASE-6-DEPLOY.md when ready).
 *
 * Run locally:
 *   npm run bot
 */
import { config as loadEnv } from "dotenv";
// Mirror Next.js precedence: .env.local overrides .env
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { Bot } from "grammy";
import { onStart } from "./handlers/start";
import { onCatalog } from "./handlers/catalog";
import { onOrders } from "./handlers/orders";
import { onHelp } from "./handlers/help";

function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[bot] TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
  }

  const bot = new Bot(token);

  bot.command("start", onStart);
  bot.command("catalog", onCatalog);
  bot.command("orders", onOrders);
  bot.command("help", onHelp);

  bot.catch((err) => {
    console.error("[bot] handler error", err);
  });

  console.log("[bot] starting (polling)…");
  bot.start({
    onStart: (me) => console.log(`[bot] @${me.username} ready`),
  });

  // Graceful shutdown
  process.once("SIGINT", () => bot.stop());
  process.once("SIGTERM", () => bot.stop());
}

main();
