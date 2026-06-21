"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnGhost, btnPrimary, btnDanger, inputSm, StatusPill, IconChevronRight } from "@/components/ui";
import { McEditor, type McValue } from "./McEditor";
import { validateMc } from "@/lib/question";
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
  const isMc = q.type === "multiple_choice";
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState(q.prompt);
  const [answers, setAnswers] = useState(q.accepted_answers.join("\n"));
  const [mc, setMc] = useState<McValue>({
    options: isMc && q.options && q.options.length >= 2 ? [...q.options] : ["", ""],
    correctIndex: isMc ? q.correct_option : null,
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    setNotice(null);
    try {
      if (isMc) {
        const v = validateMc(mc.options, mc.correctIndex ?? -1);
        if (!v.ok) {
          setError(v.error ?? "Invalid options");
          setBusy(false);
          return;
        }
        await api("/api/admin/questions", "PATCH", {
          id: q.id,
          prompt: prompt.trim(),
          options: v.options,
          correctOption: mc.correctIndex,
        });
      } else {
        const res = await api<{ regrade?: { newlyCredited: number } }>("/api/admin/questions", "PATCH", {
          id: q.id,
          prompt: prompt.trim(),
          acceptedAnswers: answers.split("\n").map((a) => a.trim()).filter(Boolean),
        });
        if (res.regrade) {
          setNotice(`Re-graded — ${res.regrade.newlyCredited} newly credited`);
        }
      }
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setPrompt(q.prompt);
    setAnswers(q.accepted_answers.join("\n"));
    setMc({
      options: isMc && q.options && q.options.length >= 2 ? [...q.options] : ["", ""],
      correctIndex: isMc ? q.correct_option : null,
    });
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
          <div className="flex items-center gap-2 shrink-0">
            {isMc && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-paper border border-line rounded-full px-2 py-0.5">
                MC
              </span>
            )}
            <StatusPill status={q.status} />
          </div>
        </div>

        {/* Display/edit answers or MC options */}
        {editing ? (
          isMc ? (
            <div className="mt-2">
              <McEditor value={mc} onChange={setMc} />
            </div>
          ) : (
            <textarea
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              rows={3}
              className={`${inputSm} mt-2`}
              placeholder="Accepted answers, one per line"
            />
          )
        ) : isMc ? (
          <div className="mt-2 space-y-1">
            {(q.options ?? []).map((opt, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 border ${
                  i === q.correct_option
                    ? "bg-success-soft border-success/30 text-success font-semibold"
                    : "bg-paper border-line text-muted"
                }`}
              >
                {i === q.correct_option && <IconCheckSmall />}
                <span>{opt}</span>
              </div>
            ))}
          </div>
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

        {notice && (
          <p className="text-success text-sm font-medium mt-2 bg-success-soft border border-success/30 rounded-lg px-3 py-1.5">
            {notice}
          </p>
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
                onClick={cancelEdit}
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

function IconCheckSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
