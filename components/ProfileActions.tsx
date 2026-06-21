"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost, btnDanger, IconSwap, IconLogout } from "./ui";

export function ProfileActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function endSession() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={endSession} disabled={busy} className={`${btnGhost} inline-flex items-center justify-center gap-2`}>
        <IconSwap size={17} /> Switch user
      </button>
      <button onClick={endSession} disabled={busy} className={`${btnDanger} inline-flex items-center justify-center gap-2`}>
        <IconLogout size={17} /> Log out
      </button>
    </div>
  );
}
