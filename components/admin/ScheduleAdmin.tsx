"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnPrimary, inputSm } from "@/components/ui";

export interface BlockLite {
  id: number;
  name: string;
  start: string; // HH:MM
  end: string;
}

export function ScheduleAdmin({ blocks }: { blocks: BlockLite[] }) {
  return (
    <div className="space-y-2">
      <p className="text-muted text-sm mb-3">
        Editing a time updates the personalized schedule and the menu reveals that anchor to it.
      </p>
      {blocks.map((b) => (
        <BlockRow key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockRow({ block }: { block: BlockLite }) {
  const router = useRouter();
  const [start, setStart] = useState(block.start);
  const [end, setEnd] = useState(block.end);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = start !== block.start || end !== block.end;

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await api("/api/admin/schedule", "PATCH", { id: block.id, start, end });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-line p-4 flex flex-wrap items-center gap-3">
      <span className="font-medium text-ink flex-1 min-w-[8rem]">
        <span className="text-muted text-xs tabular-nums mr-2">#{block.id}</span>
        {block.name}
      </span>
      <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputSm} w-28`} />
      <span className="text-muted">–</span>
      <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inputSm} w-28`} />
      <button onClick={save} disabled={busy || !dirty} className={btnPrimary}>
        {saved ? "Saved" : "Save"}
      </button>
      {error && (
        <p role="alert" className="text-brand text-sm font-medium w-full">
          {error}
        </p>
      )}
    </div>
  );
}
