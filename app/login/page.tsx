"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getInitData, isInTelegram, haptic } from "@/lib/tg";
import { btnFull, inputCls, NishanBar } from "@/components/ui";

type Phase = "checking" | "form";

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [misId, setMisId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);

  // Try Telegram auto-login on mount; fall back to the MIS ID form.
  useEffect(() => {
    let cancelled = false;
    async function tryAuto() {
      if (!isInTelegram()) {
        setPhase("form");
        return;
      }
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: getInitData() }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.authenticated) {
          router.replace("/schedule");
          return;
        }
        if (data.tgFirstName) setGreeting(data.tgFirstName);
        setPhase("form");
      } catch {
        if (!cancelled) setPhase("form");
      }
    }
    tryAuto();
    return () => {
      cancelled = true;
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
          <h1 className="text-2xl font-bold tracking-tight text-ink">KY Asmita Din</h1>
          <p className="text-muted text-sm mt-1">Bal-Balika · June 21, 2026</p>
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
              {greeting && (
                <p className="text-sm text-ink mb-3">
                  Welcome, <span className="font-semibold">{greeting}</span>. Enter your MIS ID to
                  link your account.
                </p>
              )}
              <label htmlFor="mis" className="block text-sm font-medium text-ink mb-2">
                MIS ID
              </label>
              <input
                id="mis"
                inputMode="numeric"
                autoComplete="off"
                value={misId}
                onChange={(e) => setMisId(e.target.value)}
                placeholder="e.g. 586086"
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
              <p className="text-muted text-xs mt-4 leading-relaxed">
                Your MIS ID is on your registration. Logging in on a new device moves your
                account to it.
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
