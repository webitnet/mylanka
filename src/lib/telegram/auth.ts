import { prisma } from "@/lib/prisma";
import { validateInitData, type TelegramUser } from "./initData";

export type TelegramAuthResult =
  | {
      ok: true;
      user: TelegramUser;
      customer: {
        id: string;
        telegramId: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        locale: string;
      };
    }
  | { ok: false; status: number; code: string; message: string };

/**
 * Validates the `x-telegram-init-data` header (or `initData` body field) and
 * returns the associated Customer, creating one on first contact.
 */
export async function authenticateTelegram(initData: string): Promise<TelegramAuthResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      ok: false,
      status: 500,
      code: "BOT_NOT_CONFIGURED",
      message: "TELEGRAM_BOT_TOKEN is not set",
    };
  }
  if (!initData) {
    return {
      ok: false,
      status: 400,
      code: "MISSING_INIT_DATA",
      message: "Missing initData",
    };
  }

  const v = validateInitData(initData, token);
  if (!v.ok) {
    return {
      ok: false,
      status: 401,
      code: v.reason.toUpperCase(),
      message: `initData invalid: ${v.reason}`,
    };
  }

  const tu = v.user;
  const telegramId = String(tu.id);
  const locale = tu.language_code?.startsWith("uk") ? "uk" : "en";

  const customer = await prisma.customer.upsert({
    where: { telegramId },
    update: {
      firstName: tu.first_name ?? undefined,
      lastName: tu.last_name ?? undefined,
    },
    create: {
      telegramId,
      firstName: tu.first_name ?? null,
      lastName: tu.last_name ?? null,
      locale,
    },
    select: {
      id: true,
      telegramId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      locale: true,
    },
  });

  return {
    ok: true,
    user: tu,
    customer: { ...customer, telegramId: customer.telegramId! },
  };
}

/** Reads initData from request header or returns null. */
export function readInitDataFromRequest(req: Request): string | null {
  return req.headers.get("x-telegram-init-data");
}
