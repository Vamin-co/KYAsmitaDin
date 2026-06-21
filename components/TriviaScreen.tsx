"use client";

import { useState, useMemo } from "react";
import { StatsCard } from "./StatsCard";
import { Confetti } from "./Confetti";
import { IconCheck, IconX, inputCls, btnFull, NishanBar } from "./ui";
import { haptic } from "@/lib/tg";

export interface Attempt {
  attempt_no: number;
  raw_answer: string;
  is_correct: boolean;
}
interface Stats {
  score: number;
  current: number;
  longest: number;
}
interface QV {
  id: string;
  prompt: string;
  type: "text" | "multiple_choice";
  options: string[];
}

export function TriviaScreen({
  questions,
  initialAttempts,
  initialStats,
  creditedQuestionIds,
}: {
  questions: QV[];
  initialAttempts: Record<string, Attempt[]>;
  initialStats: Stats;
  creditedQuestionIds: string[];
}) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const credited = useMemo(() => new Set(creditedQuestionIds), [creditedQuestionIds]);

  return (
    <div className="space-y-4">
      <StatsCard score={stats.score} current={stats.current} longest={stats.longest} />

      {questions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-line p-8 text-center animate-rise">
          <p className="text-ink font-semibold">No questions are live right now</p>
          <p className="text-muted text-sm mt-1">
            Trivia opens during the day — check back when a question goes live.
          </p>
        </div>
      ) : (
        questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            initial={initialAttempts[q.id] ?? []}
            onStats={setStats}
            isCredited={credited.has(q.id)}
          />
        ))
      )}
    </div>
  );
}

function QuestionCard({
  question,
  initial,
  onStats,
  isCredited,
}: {
  question: QV;
  initial: Attempt[];
  onStats: (s: Stats) => void;
  isCredited: boolean;
}) {
  const isMc = question.type === "multiple_choice";
  const maxAttempts = isMc ? 1 : 2;

  const [attempts, setAttempts] = useState<Attempt[]>(initial);
  const [input, setInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);

  const solved = attempts.some((a) => a.is_correct) || isCredited;
  const finished = solved || attempts.length >= maxAttempts;

  // ---- free-text submit ----
  async function submitText(e: React.FormEvent) {
    e.preventDefault();
    if (busy || finished || !input.trim()) return;
    setBusy(true);
    setError(null);
    const raw = input.trim();
    try {
      const res = await fetch("/api/trivia/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answer: raw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not submit");
        setBusy(false);
        return;
      }
      const correct = !!data.correct;
      setAttempts((prev) => [
        ...prev,
        { attempt_no: prev.length + 1, raw_answer: raw, is_correct: correct },
      ]);
      if (data.stats) {
        onStats({
          score: data.stats.score,
          current: data.stats.streak.current,
          longest: data.stats.streak.longest,
        });
      }
      setInput("");
      if (correct) {
        haptic("success");
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1300);
      } else {
        haptic("error");
      }
      setBusy(false);
    } catch {
      setError("Network error — try again");
      setBusy(false);
    }
  }

  // ---- MC submit ----
  async function submitMc() {
    if (busy || finished || selectedOption === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trivia/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, optionIndex: selectedOption }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not submit");
        setBusy(false);
        return;
      }
      const correct = !!data.correct;
      const label = question.options[selectedOption] ?? "";
      setAttempts((prev) => [
        ...prev,
        { attempt_no: 1, raw_answer: label, is_correct: correct },
      ]);
      if (data.stats) {
        onStats({
          score: data.stats.score,
          current: data.stats.streak.current,
          longest: data.stats.streak.longest,
        });
      }
      if (correct) {
        haptic("success");
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1300);
      } else {
        haptic("error");
      }
      setBusy(false);
    } catch {
      setError("Network error — try again");
      setBusy(false);
    }
  }

  // ---- regraded banner (Feature B) ----
  const wasRegradedCorrect = isCredited && !attempts.some((a) => a.is_correct);

  return (
    <div className="bg-card rounded-2xl border border-line overflow-hidden animate-rise relative">
      <NishanBar />
      {confetti && <Confetti />}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2 rounded-full bg-success animate-blink" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-success">
            Question is live
          </span>
        </div>
        <p className="text-lg font-semibold text-ink leading-snug">{question.prompt}</p>

        {/* Previous attempts */}
        {attempts.length > 0 && (
          <ul className="mt-4 space-y-2">
            {attempts.map((a) => (
              <li
                key={a.attempt_no}
                className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
                  a.is_correct
                    ? "bg-success-soft border-success/30 text-success"
                    : wasRegradedCorrect
                      ? "bg-success-soft border-success/30 text-success"
                      : "bg-brand-soft border-brand/20 text-brand-deep"
                }`}
              >
                {a.is_correct || wasRegradedCorrect ? <IconCheck size={16} /> : <IconX size={16} />}
                <span className="font-medium break-words">{a.raw_answer}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Outcome banners */}
        {wasRegradedCorrect ? (
          <div className="mt-4 bg-success-soft border border-success/30 rounded-xl px-4 py-4 text-center animate-pop">
            <p className="text-success font-bold">Correct</p>
            <p className="text-success text-sm mt-0.5">Updated — your answer was accepted</p>
          </div>
        ) : solved ? (
          <div className="mt-4 bg-success-soft border border-success/30 rounded-xl px-4 py-4 text-center animate-pop">
            <p className="text-success font-bold">Correct</p>
            <p className="text-success text-sm mt-0.5">+1 point added</p>
          </div>
        ) : finished ? (
          <div className="mt-4 bg-paper border border-line rounded-xl px-4 py-4 text-center">
            <p className="text-ink font-semibold">No attempts left</p>
            <p className="text-muted text-sm mt-0.5">
              {isMc
                ? "Your selection has been recorded."
                : "Both attempts used for this question."}
            </p>
          </div>
        ) : isMc ? (
          /* ---- MC input: tappable single-select options ---- */
          <div className="mt-4">
            <div className="space-y-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={busy}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors tap ${
                    selectedOption === i
                      ? "border-brand bg-brand-soft text-ink"
                      : "border-line bg-paper text-ink hover:border-muted"
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span
                      className={`size-5 shrink-0 rounded-full border-2 grid place-items-center transition-colors ${
                        selectedOption === i
                          ? "border-brand bg-brand"
                          : "border-muted"
                      }`}
                    >
                      {selectedOption === i && (
                        <span className="size-2 rounded-full bg-white" />
                      )}
                    </span>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-brand text-sm font-medium mt-2">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-muted text-xs font-medium">1 attempt only</span>
            </div>
            <button
              type="button"
              onClick={submitMc}
              disabled={busy || selectedOption === null}
              className={`${btnFull} mt-2`}
            >
              {busy ? "Checking…" : "Submit answer"}
            </button>
          </div>
        ) : (
          /* ---- free-text input: unchanged ---- */
          <form onSubmit={submitText} className={`mt-4 ${error ? "animate-shake" : ""}`}>
            <label htmlFor={`answer-${question.id}`} className="sr-only">
              Your answer
            </label>
            <input
              id={`answer-${question.id}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer"
              autoComplete="off"
              className={inputCls}
              disabled={busy}
            />
            {error && (
              <p role="alert" className="text-brand text-sm font-medium mt-2">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-muted text-xs font-medium">
                Attempt {attempts.length + 1} of 2
              </span>
            </div>
            <button type="submit" disabled={busy || !input.trim()} className={`${btnFull} mt-2`}>
              {busy ? "Checking…" : "Submit answer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
