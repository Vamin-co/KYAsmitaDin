"use client";

import { useEffect } from "react";
import { getWebApp } from "@/lib/tg";

// Initializes the Telegram webview: ready(), expand to full height, match brand chrome,
// and expose the stable viewport height as a CSS var for layout. No-ops outside Telegram.
export function TelegramInit() {
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    try {
      wa.ready();
      wa.expand();
      wa.setHeaderColor?.("#faf7f2");
      wa.setBackgroundColor?.("#faf7f2");
    } catch {
      /* ignore */
    }

    const applyHeight = () => {
      const h = wa.viewportStableHeight || wa.viewportHeight;
      if (h) document.documentElement.style.setProperty("--tg-viewport", `${h}px`);
    };
    applyHeight();
    wa.onEvent?.("viewportChanged", applyHeight);
  }, []);

  return null;
}
