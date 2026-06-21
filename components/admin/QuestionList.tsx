"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnGhost, btnPrimary, btnDanger, inputSm, StatusPill, IconChevronRight } from "@/components/ui";
import type { Question } from "@/lib/types";

export function QuestionList({ questions }: { questions: Question[] }) {
  if (questions.length === 0) {
    return <p className="text-muted text-sm">No questions yet. Add one above.</p>;
  }
  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <QuestionRow key={q.id} q={q} />
      ))}
    </div>
  );
}

function QuestionRow({ q }: { q: Question }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState(q.prompt);
  const [answers, setAnswers] = useState(q.accepted_answers.join("\n"));
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "draft" | "open" | "closed") {
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/questions", "PATCH", { id: q.id, status });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/questions", "PATCH", {
        id: q.id,
        prompt: prompt.trim(),
        acceptedAnswers: answers.split("\n").map((a) => a.trim()).filter(Boolean),
      });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`bg-card rounded-2xl border overflow-hidden ${
        q.status === "open" ? "border-success/40" : "border-line"
      }`}
    >
      {q.status === "open" && <div className="nishan-bar" aria-hidden="true" />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {editing ? (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className={`${inputSm} mb-2`}
              />
            ) : (
              <p className="font-medium text-ink leading-snug">{q.prompt}</p>
            )}
          </div>
          <StatusPill status={q.status} />
        </div>

        {editing ? (
          <textarea
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            rows={3}
            className={`${inputSm} mt-2`}
            placeholder="Accepted answers, one per line"
          />
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {q.accepted_answers.map((a, i) => (
              <span
                key={i}
                className="text-xs bg-paper border border-line rounded-full px-2.5 py-1 text-muted"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-brand text-sm font-medium mt-2">
            {error}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {q.status !== "open" ? (
            <button onClick={() => setStatus("open")} disabled={busy} className={btnPrimary}>
              Open
            </button>
          ) : (
            <button onClick={() => setStatus("closed")} disabled={busy} className={btnDanger}>
              Close
            </button>
          )}
          {editing ? (
            <>
              <button onClick={saveEdit} disabled={busy} className={btnPrimary}>
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setPrompt(q.prompt);
                  setAnswers(q.accepted_answers.join("\n"));
                }}
                disabled={busy}
                className={btnGhost}
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} disabled={busy} className={btnGhost}>
              Edit
            </button>
          )}
          <Link
            href={`/admin/questions/${q.id}`}
            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand active:opacity-70 tap"
          >
            Answers & corrections <IconChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
