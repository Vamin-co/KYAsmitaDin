import { IconFlame } from "./ui";

// Personal stats only — score + current/longest streak. No ranking (deliberate).
export function StatsCard({
  score,
  current,
  longest,
}: {
  score: number;
  current: number;
  longest: number;
}) {
  return (
    <div className="bg-card rounded-2xl border border-line overflow-hidden">
      <div className="nishan-bar" aria-hidden="true" />
      <div className="grid grid-cols-3 divide-x divide-line">
        <Stat label="Points" value={score} />
        <Stat
          label="Streak"
          value={current}
          icon={<IconFlame size={15} className="text-brand" />}
        />
        <Stat label="Best" value={longest} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-2xl font-bold tabular-nums leading-none text-ink">{value}</span>
      </div>
      <div className="text-muted text-[11px] font-semibold uppercase tracking-wide mt-1.5">
        {label}
      </div>
    </div>
  );
}
