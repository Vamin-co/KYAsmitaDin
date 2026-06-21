"use client";

import { useEffect, useState } from "react";
import { formatTime, nowMinutesInEventTz, timeToMinutes } from "@/lib/time";
// initialNow is the server-computed minutes-in-event-tz so reveals render immediately.
import { IconLock, IconClock } from "./ui";

export interface MenuSectionVM {
  id: string;
  label: string;
  items: string[];
  manualState: "reveal" | "hide" | null;
  anchorStart: string | null; // HH:MM (resolved, admin-adjustable)
}

export function MenuList({
  sections,
  initialNow,
}: {
  sections: MenuSectionVM[];
  initialNow: number | null;
}) {
  const [nowMin, setNowMin] = useState<number | null>(initialNow);
  useEffect(() => {
    const tick = () => setNowMin(nowMinutesInEventTz());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  function revealed(s: MenuSectionVM): boolean {
    if (s.manualState === "reveal") return true;
    if (s.manualState === "hide") return false;
    const start = timeToMinutes(s.anchorStart);
    if (start === null || nowMin === null) return false;
    return nowMin >= start;
  }

  return (
    <div className="space-y-3">
      {sections.map((s, i) => {
        const open = revealed(s);
        return (
          <section
            key={s.id}
            className={`rounded-2xl border overflow-hidden animate-rise ${
              open ? "bg-card border-line" : "bg-paper border-line"
            }`}
            style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
          >
            <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
              <h2 className="text-lg font-semibold text-ink">{s.label}</h2>
              {!open && (
                <span className="inline-flex items-center gap-1 text-muted text-xs font-medium">
                  <IconLock size={14} />
                  {s.anchorStart ? `Reveals ${formatTime(s.anchorStart)}` : "Not yet"}
                </span>
              )}
            </div>
            {open ? (
              <ul className="px-5 pb-4 pt-1 grid gap-1.5">
                {s.items.map((it) => (
                  <li key={it} className="flex items-center gap-2.5 text-ink">
                    <span className="size-1.5 rounded-full bg-gold shrink-0" aria-hidden="true" />
                    <span className="text-[15px]">{it}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 pb-4 pt-1 flex items-center gap-2 text-muted text-sm">
                <IconClock size={15} />
                <span>Revealed when this part of the day begins.</span>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
