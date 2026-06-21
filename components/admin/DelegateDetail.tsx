"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnPrimary, btnGhost, btnDanger, inputSm, IconFlame } from "@/components/ui";

export interface DelegateLite {
  id: string;
  misId: string;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  wing: string;
  mandal: string;
  subgroup: string;
  center: string;
  goshthiGroup: string;
  track: string | null;
  isAdmin: boolean;
  isActive: boolean;
  hasBinding: boolean;
}

export interface HistoryRow {
  id: string;
  delta: number;
  source: string;
  note: string | null;
  when: string;
  actorLabel: string;
  refLabel: string | null;
}

const SOURCE_LABEL: Record<string, string> = {
  question_correct: "Correct answer",
  manual_adjustment: "Manual adjustment",
  correction: "Correction",
};

export function DelegateDetail({
  delegate,
  stats,
  history,
}: {
  delegate: DelegateLite;
  stats: { score: number; current: number; longest: number };
  history: HistoryRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: delegate.firstName,
    middleName: delegate.middleName,
    lastName: delegate.lastName,
    wing: delegate.wing,
    mandal: delegate.mandal,
    subgroup: delegate.subgroup,
    center: delegate.center,
    goshthiGroup: delegate.goshthiGroup,
  });

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addPoints(n?: number) {
    const value = n ?? Number(delta);
    if (!Number.isInteger(value) || value === 0) {
      setError("Enter a non-zero whole number");
      return;
    }
    await run(async () => {
      await api("/api/admin/points", "POST", { delegateId: delegate.id, delta: value, note: note.trim() });
      setDelta("");
      setNote("");
    });
  }

  return (
    <div className="space-y-5">
      {/* identity + stats */}
      <div className="bg-card rounded-2xl border border-line overflow-hidden">
        <div className="nishan-bar" aria-hidden="true" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink">{delegate.name}</h1>
              <p className="text-muted text-sm tabular-nums mt-0.5">
                MIS {delegate.misId} · {delegate.goshthiGroup} · Track {delegate.track ?? "—"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {delegate.isAdmin && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-brand text-white rounded-full px-2.5 py-0.5">
                  Admin
                </span>
              )}
              {!delegate.isActive && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-paper text-muted border border-line rounded-full px-2.5 py-0.5">
                  Removed
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Points" value={stats.score} />
            <Stat label="Streak" value={stats.current} flame />
            <Stat label="Best" value={stats.longest} />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-brand text-sm font-medium">
          {error}
        </p>
      )}

      {/* manual points */}
      <section className="bg-card rounded-2xl border border-line p-5">
        <h2 className="text-lg font-semibold text-ink mb-3">Adjust points</h2>
        <div className="flex gap-2 mb-3">
          <button onClick={() => addPoints(1)} disabled={busy} className={btnGhost}>
            +1
          </button>
          <button onClick={() => addPoints(-1)} disabled={busy} className={btnGhost}>
            −1
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 2 or -1"
            className={`${inputSm} sm:w-28`}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (optional)"
            className={inputSm}
          />
          <button onClick={() => addPoints()} disabled={busy} className={btnPrimary}>
            Apply
          </button>
        </div>
      </section>

      {/* account actions */}
      <section className="bg-card rounded-2xl border border-line p-5">
        <h2 className="text-lg font-semibold text-ink mb-3">Account</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => run(async () => { await api("/api/admin/delegates", "PATCH", { id: delegate.id, isAdmin: !delegate.isAdmin }); })}
            disabled={busy}
            className={btnGhost}
          >
            {delegate.isAdmin ? "Demote from admin" : "Promote to admin"}
          </button>
          <button
            onClick={() => run(async () => { await api("/api/admin/delegates", "PATCH", { id: delegate.id, isActive: !delegate.isActive }); })}
            disabled={busy}
            className={delegate.isActive ? btnDanger : btnPrimary}
          >
            {delegate.isActive ? "Remove (deactivate)" : "Reactivate"}
          </button>
          {delegate.hasBinding && (
            <button
              onClick={() => run(async () => { await api("/api/admin/account", "POST", { action: "clear_binding", delegateId: delegate.id }); })}
              disabled={busy}
              className={btnGhost}
            >
              Clear Telegram binding
            </button>
          )}
          <button onClick={() => setEditing((v) => !v)} disabled={busy} className={btnGhost}>
            {editing ? "Cancel edit" : "Edit details"}
          </button>
        </div>

        {editing && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {([
              ["firstName", "First name"],
              ["lastName", "Last name"],
              ["middleName", "Middle name"],
              ["mandal", "Mandal"],
              ["center", "Center"],
              ["subgroup", "Subgroup"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-ink mb-1">{label}</label>
                <input
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className={inputSm}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Wing</label>
              <select
                value={form.wing}
                onChange={(e) => setForm((f) => ({ ...f, wing: e.target.value }))}
                className={inputSm}
              >
                <option value="eSide">eSide</option>
                <option value="iSide">iSide</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Goshthi group (sets track)</label>
              <input
                value={form.goshthiGroup}
                onChange={(e) => setForm((f) => ({ ...f, goshthiGroup: e.target.value }))}
                className={inputSm}
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={() => run(async () => { await api("/api/admin/delegates", "PATCH", { id: delegate.id, ...form }); setEditing(false); })}
                disabled={busy}
                className={btnPrimary}
              >
                Save details
              </button>
            </div>
          </div>
        )}
      </section>

      {/* point history */}
      <section className="bg-card rounded-2xl border border-line p-5">
        <h2 className="text-lg font-semibold text-ink mb-3">Point history</h2>
        {history.length === 0 ? (
          <p className="text-muted text-sm">No ledger entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-3 text-sm bg-paper border border-line rounded-lg px-3 py-2"
              >
                <span
                  className={`font-bold tabular-nums shrink-0 ${
                    h.delta >= 0 ? "text-success" : "text-brand"
                  }`}
                >
                  {h.delta >= 0 ? `+${h.delta}` : h.delta}
                </span>
                <span className="min-w-0">
                  <span className="block text-ink font-medium">
                    {SOURCE_LABEL[h.source] ?? h.source}
                    {h.refLabel && <span className="text-muted font-normal"> · {h.refLabel}</span>}
                  </span>
                  {h.note && <span className="block text-muted text-xs">{h.note}</span>}
                  <span className="block text-muted text-[11px]">
                    {h.when} · by {h.actorLabel}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, flame }: { label: string; value: number; flame?: boolean }) {
  return (
    <div className="bg-paper rounded-xl border border-line py-3">
      <div className="flex items-center justify-center gap-1">
        {flame && <IconFlame size={14} className="text-brand" />}
        <span className="text-2xl font-bold tabular-nums text-ink leading-none">{value}</span>
      </div>
      <div className="text-muted text-[11px] font-semibold uppercase tracking-wide mt-1.5">{label}</div>
    </div>
  );
}
