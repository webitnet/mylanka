import { useEffect } from "react";
import { getWebApp } from "./telegram";

/**
 * Bind Telegram MainButton to a label + handler for the current screen.
 * Hides automatically on unmount.
 */
export function useMainButton(opts: {
  text: string;
  onClick: () => void;
  enabled?: boolean;
  color?: string;
  textColor?: string;
}) {
  const { text, onClick, enabled = true, color = "#A8252E", textColor = "#FBF5E5" } = opts;

  useEffect(() => {
    const app = getWebApp();
    if (!app) return;
    try {
      app.MainButton.setText(text);
      app.MainButton.setParams({ color, text_color: textColor });
      if (enabled) {
        app.MainButton.show();
        app.MainButton.onClick(onClick);
      } else {
        app.MainButton.hide();
      }
      return () => {
        try {
          app.MainButton.offClick(onClick);
          app.MainButton.hide();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* older clients */
    }
  }, [text, onClick, enabled, color, textColor]);
}
