import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all paths except: api, trpc, _next, _vercel, admin, files with an extension.
  // Admin uses its own server-side session check (see src/app/admin/layout.tsx).
  matcher: ["/((?!api|trpc|_next|_vercel|admin|.*\\..*).*)"],
};
