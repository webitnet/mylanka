import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Block well-known abusive User-Agents at the edge — they never reach a
// Vercel Function, so they don't burn compute quota. Search engines and
// real browsers fall through to the i18n middleware as before.
const BLOCKED_UA_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /OAI-SearchBot/i,
  /ClaudeBot/i,
  /anthropic-ai/i,
  /Claude-Web/i,
  /CCBot/i,
  /PerplexityBot/i,
  /Bytespider/i,
  /Meta-ExternalAgent/i,
  /FacebookBot/i,
  /Amazonbot/i,
  /Applebot-Extended/i,
  /DataForSeoBot/i,
  /Diffbot/i,
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /PetalBot/i,
  /BLEXBot/i,
  /SeekportBot/i,
  /serpstatbot/i,
];

function isBlockedAgent(ua: string | null): boolean {
  if (!ua) return false;
  return BLOCKED_UA_PATTERNS.some((re) => re.test(ua));
}

export default function proxy(request: NextRequest) {
  if (isBlockedAgent(request.headers.get("user-agent"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except: api, trpc, _next, _vercel, admin, files with an extension.
  matcher: ["/((?!api|trpc|_next|_vercel|admin|.*\\..*).*)"],
};
