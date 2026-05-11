/**
 * Thin typed wrapper over window.Telegram.WebApp.
 * The script is loaded via index.html, so this module has no JS deps.
 */

type Impact = "light" | "medium" | "heavy";

type TelegramWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  HapticFeedback: {
    impactOccurred: (style: Impact) => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  MainButton: {
    setText: (text: string) => void;
    setParams: (params: { color?: string; text_color?: string }) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  close: () => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  return typeof window !== "undefined" ? (window.Telegram?.WebApp ?? null) : null;
}

/**
 * Initialise Telegram WebApp: expand to full height, apply brand colors.
 * Returns initData (URL-encoded query string) for the backend handshake.
 *
 * If we're running outside Telegram (e.g. `vite dev` in a browser tab),
 * initData is empty — we expose a dev-fallback so the catalog still loads.
 */
export function initTelegram(): { initData: string; isTelegram: boolean } {
  const webApp = getWebApp();
  if (!webApp) return { initData: "", isTelegram: false };
  try {
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor("#3A2A1C");
    webApp.setBackgroundColor("#FBF5E5");
  } catch {
    /* tolerate older Telegram clients */
  }
  return { initData: webApp.initData ?? "", isTelegram: !!webApp.initData };
}

export function haptic(impact: Impact = "light") {
  try {
    getWebApp()?.HapticFeedback.impactOccurred(impact);
  } catch {
    /* no-op outside Telegram */
  }
}
