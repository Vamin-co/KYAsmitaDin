"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconFlame } from "@/components/ui";

export interface StandingLite {
  delegateId: string;
  name: string;
  misId: string;
  score: number;
  current: number;
  longest: number;
  isActive: boolean;
}

export function StandingsTable({ rows }: { rows: StandingLite[] }) {
  const [sortBy, setSortBy] = useState<"score" | "streak">("score");
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortBy === "score") {
      copy.sort((a, b) => b.score - a.score || b.longest - a.longest);
    } else {
      copy.sort((a, b) => b.longest - a.longest || b.current - a.current || b.score - a.score);
    }
    return copy;
  }, [rows, sortBy]);

  const visible = showAll ? sorted : sorted.slice(0, 10);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-muted text-sm mr-1">Sort by</span>
        <Toggle active={sortBy === "score"} onClick={() => setSortBy("score")}>
          Score
        </Toggle>
        <Toggle active={sortBy === "streak"} onClick={() => setSortBy("streak")}>
          Streak
        </Toggle>
      </div>

      <div className="bg-card rounded-2xl border border-line overflow-hidden">
        <div className="grid grid-cols-[2.2rem_1fr_auto_auto] items-center gap-3 px-4 py-2.5 border-b border-line text-[11px] font-bold uppercase tracking-wide text-muted">
          <span>#</span>
          <span>Delegate</span>
          <span className="text-right">Pts</span>
          <span className="text-right pr-1">Best</span>
        </div>
        {visible.map((r, i) => (
          <Link
            key={r.delegateId}
            href={`/admin/delegates/${r.delegateId}`}
            className={`grid grid-cols-[2.2rem_1fr_auto_auto] items-center gap-3 px-4 py-3 border-b border-line last:border-0 tap hover:bg-paper ${
              !r.isActive ? "opacity-50" : ""
            }`}
          >
            <span
              className={`size-7 shrink-0 rounded-full grid place-items-center text-xs font-bold ${
                sortBy === "score" && i === 0
                  ? "bg-gold text-ink"
                  : sortBy === "score" && i === 1
                    ? "bg-line text-ink"
                    : sortBy === "score" && i === 2
                      ? "bg-[#e8c39e] text-ink"
                      : "bg-paper text-muted border border-line"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-ink truncate">{r.name}</span>
              <span className="block text-muted text-xs tabular-nums">
                MIS {r.misId}
                {!r.isActive && " · removed"}
              </span>
            </span>
            <span className="text-right font-bold tabular-nums text-ink">{r.score}</span>
            <span className="text-right pr-1 inline-flex items-center justify-end gap-1 tabular-nums text-ink">
              <IconFlame size={13} className="text-brand" />
              {r.longest}
            </span>
          </Link>
        ))}
      </div>

      {sorted.length > 10 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-sm font-semibold text-brand active:opacity-70 tap"
        >
          {showAll ? "Show top 10" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-semibold rounded-full px-3 py-1 border tap transition-colors ${
        active ? "bg-success-soft text-success border-success/30" : "bg-card text-muted border-line"
      }`}
    >
      {children}
    </button>
  );
}
