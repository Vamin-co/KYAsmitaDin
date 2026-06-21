"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ScheduleItem } from "@/lib/schedule";
import { formatTime, nowMinutesInEventTz, timeToMinutes, todayInEventTz } from "@/lib/time";
import { IconMap, IconPin, IconChevronRight } from "./ui";

const EVENT_DATE = "2026-06-21";

const CAT: Record<string, { dot: string; pill: string }> = {
  meal: { dot: "bg-gold", pill: "Meal" },
  program: { dot: "bg-brand", pill: "Program" },
  asmita_talks: { dot: "bg-brand", pill: "Asmita Talks" },
  goshthi: { dot: "bg-success", pill: "Goshthi" },
  travel: { dot: "bg-muted", pill: "Travel" },
  other: { dot: "bg-line", pill: "" },
};

type Status = "past" | "live" | "upcoming";

export function ScheduleTimeline({ items }: { items: ScheduleItem[] }) {
  const [nowMin, setNowMin] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      // Only mark "live" on the actual event day.
      setNowMin(todayInEventTz() === EVENT_DATE ? nowMinutesInEventTz() : null);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  function statusOf(it: ScheduleItem): Status {
    if (nowMin === null) return "upcoming";
    const s = timeToMinutes(it.start);
    const e = timeToMinutes(it.end);
    if (s === null || e === null) return "upcoming";
    if (nowMin >= e) return "past";
    if (nowMin >= s && nowMin < e) return "live";
    return "upcoming";
  }

  return (
    <ol className="relative">
      {items.map((it, i) => {
        const cat = CAT[it.category] ?? CAT.other;
        const status = statusOf(it);
        const isLast = i === items.length - 1;
        const dim = status === "past";

        return (
          <li key={it.id} className="relative flex gap-3 animate-rise" style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}>
            {/* time + rail */}
            <div className="w-14 shrink-0 text-right pt-3">
              <span className={`text-xs font-semibold tabular-nums ${status === "live" ? "text-brand" : "text-muted"}`}>
                {formatTime(it.start)}
              </span>
            </div>
            <div className="relative flex flex-col items-center">
              <span
                className={`mt-4 size-3 rounded-full ring-4 ring-paper ${cat.dot} ${
                  status === "live" ? "scale-125" : ""
                }`}
                aria-hidden="true"
              />
              {!isLast && <span className="w-px flex-1 bg-line" aria-hidden="true" />}
            </div>

            {/* card */}
            <div className={`flex-1 pb-3 ${dim ? "opacity-55" : ""}`}>
              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  status === "live"
                    ? "border-brand/40 bg-gold-soft/60 shadow-[0_1px_3px_rgba(33,29,26,0.06)]"
                    : "border-line bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink leading-snug">{it.name}</h3>
                  {status === "live" && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                      <span className="size-1.5 rounded-full bg-brand animate-blink" />
                      Now
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="tabular-nums">
                    {formatTime(it.start)} – {formatTime(it.end)}
                  </span>
                  {it.location && it.location !== "--" && (
                    <span className="inline-flex items-center gap-1">
                      <IconPin size={13} /> {it.location}
                    </span>
                  )}
                  {cat.pill && <span className="text-muted/80">{cat.pill}</span>}
                </div>

                {it.details && <p className="mt-2 text-sm text-muted leading-snug">{it.details}</p>}

                {it.highlights.length > 0 && (
                  <dl className="mt-3 rounded-xl bg-gold-soft border border-gold/30 px-3 py-2 space-y-1">
                    {it.highlights.map((h) => (
                      <div key={h.label} className="flex items-baseline gap-2 text-sm">
                        <dt className="text-gold-deep text-[11px] font-semibold uppercase tracking-wide shrink-0">
                          {h.label}
                        </dt>
                        <dd className="font-semibold text-ink">{h.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {it.hasMap && (
                  <Link
                    href="/maps"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand active:opacity-70 tap"
                  >
                    <IconMap size={16} /> View maps
                    <IconChevronRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
