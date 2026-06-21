"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnPrimary, inputSm } from "@/components/ui";

export function NewQuestion() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const acceptedAnswers = answers
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);
      await api("/api/admin/questions", "POST", { prompt: prompt.trim(), acceptedAnswers });
      setPrompt("");
      setAnswers("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-card rounded-2xl border border-line p-5 mb-5">
      <h2 className="text-lg font-semibold text-ink mb-3">New question</h2>
      <label className="block text-sm font-medium text-ink mb-1" htmlFor="q-prompt">
        Question
      </label>
      <textarea
        id="q-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        className={`${inputSm} mb-3 resize-y`}
        placeholder="e.g. In which year did Bhagwan Swaminarayan take birth?"
      />
      <label className="block text-sm font-medium text-ink mb-1" htmlFor="q-answers">
        Accepted answers <span className="text-muted font-normal">(one per line)</span>
      </label>
      <textarea
        id="q-answers"
        value={answers}
        onChange={(e) => setAnswers(e.target.value)}
        rows={3}
        className={`${inputSm} resize-y`}
        placeholder={"1781\n1781 ce\nsamvat 1837"}
      />
      <p className="text-muted text-xs mt-1">
        Matching ignores case, spacing, and punctuation.
      </p>
      {error && (
        <p role="alert" className="text-brand text-sm font-medium mt-2">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !prompt.trim() || !answers.trim()} className={`${btnPrimary} mt-3`}>
        {busy ? "Adding…" : "Add question"}
      </button>
    </form>
  );
}
