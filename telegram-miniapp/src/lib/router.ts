import { useCallback, useEffect, useState } from "react";
import { getWebApp } from "./telegram";

export type Route =
  | { name: "catalog" }
  | { name: "product"; slug: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "confirmation"; orderNumber: string };

export function useRouter(initial: Route = { name: "catalog" }) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const route = stack[stack.length - 1];

  const push = useCallback((r: Route) => {
    setStack((s) => [...s, r]);
  }, []);

  const replace = useCallback((r: Route) => {
    setStack((s) => [...s.slice(0, -1), r]);
  }, []);

  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const reset = useCallback((r: Route) => {
    setStack([r]);
  }, []);

  // Wire Telegram BackButton to our stack.
  useEffect(() => {
    const app = getWebApp();
    if (!app) return;
    const canGoBack = stack.length > 1;
    try {
      if (canGoBack) {
        app.BackButton.show();
        app.BackButton.onClick(back);
        return () => app.BackButton.offClick(back);
      } else {
        app.BackButton.hide();
      }
    } catch {
      /* older clients */
    }
  }, [stack.length, back]);

  return { route, push, replace, back, reset };
}
