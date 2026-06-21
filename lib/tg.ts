// Client-safe access to the Telegram WebApp SDK. Safe to import in client components;
// every accessor no-ops outside Telegram (plain browser fallback).

export interface TgWebApp {
  initData: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string } };
  version: string;
  ready: () => void;
  expand: () => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  onEvent?: (event: string, cb: () => void) => void;
  HapticFeedback?: { impactOccurred?: (s: string) => void; notificationOccurred?: (t: string) => void };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function getWebApp(): TgWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function isInTelegram(): boolean {
  const wa = getWebApp();
  return !!(wa && wa.initData && wa.initData.length > 0);
}

export function getInitData(): string {
  return getWebApp()?.initData ?? "";
}

export function haptic(kind: "light" | "success" | "error" = "light") {
  const wa = getWebApp();
  if (!wa?.HapticFeedback) return;
  try {
    if (kind === "success") wa.HapticFeedback.notificationOccurred?.("success");
    else if (kind === "error") wa.HapticFeedback.notificationOccurred?.("error");
    else wa.HapticFeedback.impactOccurred?.("light");
  } catch {
    /* ignore */
  }
}
