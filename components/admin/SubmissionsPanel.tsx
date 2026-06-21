"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnPrimary, btnGhost, IconCheck, IconX } from "@/components/ui";
import type { SubmissionView } from "@/lib/queries";

export function SubmissionsPanel({
  questionId,
  rows,
}: {
  questionId: string;
  rows: SubmissionView[];
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-line p-8 text-center text-muted">
        No submissions yet.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <Row key={r.delegateId} questionId={questionId} r={r} />
      ))}
    </div>
  );
}

function Row({ questionId, r }: { questionId: string; r: SubmissionView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function award() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/correction", "POST", { questionId, delegateId: r.delegateId });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/account", "POST", {
        action: "reset_attempts",
        delegateId: r.delegateId,
        questionId,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{r.name}</p>
          <p className="text-muted text-xs tabular-nums">MIS {r.misId}</p>
        </div>
        {r.credited ? (
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide bg-success-soft text-success border border-success/30 rounded-full px-2.5 py-0.5">
            Credited
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide bg-paper text-muted border border-line rounded-full px-2.5 py-0.5">
            No point
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {r.attempts.map((a) => (
          <span
            key={a.attempt_no}
            className={`inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1 border ${
              a.is_correct
                ? "bg-success-soft border-success/30 text-success"
                : "bg-brand-soft border-brand/20 text-brand-deep"
            }`}
          >
            {a.is_correct ? <IconCheck size={13} /> : <IconX size={13} />}
            <span className="font-medium">{a.raw_answer}</span>
          </span>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-brand text-sm font-medium mt-2">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!r.credited && (
          <button onClick={award} disabled={busy} className={btnPrimary}>
            Award point
          </button>
        )}
        <button onClick={reset} disabled={busy} className={btnGhost}>
          Reset attempts
        </button>
      </div>
    </div>
  );
}
