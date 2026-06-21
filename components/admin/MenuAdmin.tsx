"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/time";

export interface MenuLite {
  id: string;
  label: string;
  manualState: "reveal" | "hide" | null;
  anchorStart: string | null;
  items: string[];
}

export function MenuAdmin({ sections }: { sections: MenuLite[] }) {
  return (
    <div className="space-y-3">
      <p className="text-muted text-sm">
        Sections reveal automatically at their anchored time. Override to force a section open or
        hidden.
      </p>
      {sections.map((s) => (
        <SectionRow key={s.id} section={s} />
      ))}
    </div>
  );
}

function SectionRow({ section }: { section: MenuLite }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setState(manualState: "reveal" | "hide" | null) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/menu", "PATCH", { id: section.id, manualState });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const options: { key: "reveal" | "hide" | null; label: string }[] = [
    { key: null, label: section.anchorStart ? `Auto (${formatTime(section.anchorStart)})` : "Auto" },
    { key: "reveal", label: "Reveal now" },
    { key: "hide", label: "Hide" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">{section.label}</p>
          <p className="text-muted text-xs">{section.items.join(", ")}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = section.manualState === o.key;
          return (
            <button
              key={String(o.key)}
              onClick={() => setState(o.key)}
              disabled={busy}
              className={`text-sm font-semibold rounded-full px-3 py-1.5 border tap transition-colors ${
                active
                  ? "bg-brand text-white border-brand"
                  : "bg-card text-muted border-line hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-brand text-sm font-medium mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
