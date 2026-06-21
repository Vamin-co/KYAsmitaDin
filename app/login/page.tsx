"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getInitData, isInTelegram, haptic } from "@/lib/tg";
import { btnFull, inputCls, NishanBar } from "@/components/ui";

type Phase = "checking" | "form";

const TG_AUTO_LOGIN_KEY = "telegramAutoLoginAttempted";
const AUTO_LOGIN_TIMEOUT_MS = 5000;

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [misId, setMisId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);


  // Try Telegram auto-login on mount; fall back to the MIS ID form.
  // Uses a sessionStorage flag so the auto-login is attempted at most once
  // per browser session — if /schedule redirects back here, we skip straight
  // to the MIS ID form instead of looping.
  useEffect(() => {
    let cancelled = false;

    // One-attempt guard: if we already tried auto-login this session,
    // go straight to the form with a helpful message.
    if (typeof window !== "undefined" && sessionStorage.getItem(TG_AUTO_LOGIN_KEY)) {
      sessionStorage.removeItem(TG_AUTO_LOGIN_KEY);
      setPhase("form");
      return;
    }

    // Not in Telegram — show form immediately.
    if (!isInTelegram()) {
      setPhase("form");
      return;
    }

    // Timeout fallback: if the auto-login takes too long, bail to the form.
    const timer = setTimeout(() => {
      if (!cancelled) {
        setPhase("form");
      }
    }, AUTO_LOGIN_TIMEOUT_MS);

    async function tryAuto() {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ initData: getInitData() }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.authenticated) {
          // Mark that we attempted auto-login before redirecting.
          // If /schedule bounces us back, the guard above will catch it.
          sessionStorage.setItem(TG_AUTO_LOGIN_KEY, "1");
          router.replace("/schedule");
          return;
        }
        // Not authenticated via Telegram — show the MIS ID form.
        setPhase("form");
      } catch {
        if (!cancelled) {
          setPhase("form");
        }
      }
    }

    tryAuto();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ misId: misId.trim(), initData: getInitData() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        haptic("error");
        setError(data.error ?? "Login failed");
        setBusy(false);
        return;
      }
      haptic("success");
      router.replace("/schedule");
    } catch {
      setError("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-paper">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/AsmitaDin_Logo_Color.png"
            alt="Asmita Din"
            className="h-20 w-auto mb-4"
          />
        </div>

        {phase === "checking" ? (
          <div className="bg-card rounded-2xl border border-line overflow-hidden shadow-[0_1px_3px_rgba(33,29,26,0.07)]">
            <NishanBar />
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="size-6 rounded-full border-2 border-line border-t-brand animate-spin" />
              <p className="text-muted text-sm">Signing you in…</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className={`bg-card rounded-2xl border border-line overflow-hidden shadow-[0_1px_3px_rgba(33,29,26,0.07)] ${
              error ? "animate-shake" : "animate-rise"
            }`}
          >
            <NishanBar />
            <div className="p-6">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Welcome to Asmita Din
              </h1>
              <p className="text-muted text-sm mt-1 mb-5">
                Please enter your MIS ID to continue.
              </p>
              <label htmlFor="mis" className="block text-sm font-medium text-ink mb-2">
                MIS ID
              </label>
              <input
                id="mis"
                inputMode="numeric"
                autoComplete="off"
                value={misId}
                onChange={(e) => setMisId(e.target.value)}
                placeholder="70123456"
                className={inputCls}
                aria-invalid={!!error}
              />
              {error && (
                <p role="alert" className="text-brand text-sm font-medium mt-2">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy || !misId.trim()} className={`${btnFull} mt-4`}>
                {busy ? "Checking…" : "Enter"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-muted text-xs mt-6">
          Kishore-Kishori · Yuvak-Yuvati Asmita Din · 2026
        </p>
      </div>
    </main>
  );
}
