import { NextResponse } from "next/server";
import { authenticateTelegram, readInitDataFromRequest } from "@/lib/telegram/auth";

export type TelegramAuthResponse = {
  customer: {
    id: string;
    telegramId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    locale: string;
  };
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
};

export async function POST(req: Request) {
  // initData can arrive via header (preferred) or body for clients that can't
  // set custom headers easily.
  let initData = readInitDataFromRequest(req);
  if (!initData) {
    try {
      const body = (await req.json()) as { initData?: string };
      initData = body.initData ?? null;
    } catch {
      /* ignore */
    }
  }

  const result = await authenticateTelegram(initData ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: result.status },
    );
  }

  return NextResponse.json<TelegramAuthResponse>({
    customer: result.customer,
    user: {
      id: result.user.id,
      first_name: result.user.first_name,
      last_name: result.user.last_name,
      username: result.user.username,
      photo_url: result.user.photo_url,
    },
  });
}
