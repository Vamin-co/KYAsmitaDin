"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { btnPrimary, inputSm } from "@/components/ui";
import { McEditor, type McValue } from "./McEditor";
import { validateMc } from "@/lib/question";

type QType = "text" | "multiple_choice";

export function NewQuestion() {
  const router = useRouter();
  const [type, setType] = useState<QType>("text");
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState("");
  const [mc, setMc] = useState<McValue>({ options: ["", ""], correctIndex: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPrompt("");
    setAnswers("");
    setMc({ options: ["", ""], correctIndex: null });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    let payload: Record<string, unknown>;
    if (type === "multiple_choice") {
      const v = validateMc(mc.options, mc.correctIndex ?? -1);
      if (!v.ok) {
        setError(v.error ?? "Invalid options");
        return;
      }
      payload = {
        prompt: prompt.trim(),
        type: "multiple_choice",
        options: v.options,
        correctOption: mc.correctIndex,
      };
    } else {
      const acceptedAnswers = answers.split("\n").map((a) => a.trim()).filter(Boolean);
      if (acceptedAnswers.length === 0) {
        setError("Add at least one accepted answer");
        return;
      }
      payload = { prompt: prompt.trim(), type: "text", acceptedAnswers };
    }

    setBusy(true);
    try {
      await api("/api/admin/questions", "POST", payload);
      reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !!prompt.trim() && (type === "text" ? !!answers.trim() : true);

  return (
    <form onSubmit={submit} className="bg-card rounded-2xl border border-line p-5 mb-5">
      <h2 className="text-lg font-semibold text-ink mb-3">New question</h2>

      <div className="flex gap-2 mb-4">
        {(["text", "multiple_choice"] as QType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`text-sm font-semibold rounded-full px-3 py-1.5 border tap transition-colors ${
              type === t ? "bg-brand text-white border-brand" : "bg-card text-muted border-line"
            }`}
          >
            {t === "text" ? "Free text" : "Multiple choice"}
          </button>
        ))}
      </div>

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

      {type === "text" ? (
        <>
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
            Matching ignores case, spacing, and punctuation; comma lists match in any order.
          </p>
        </>
      ) : (
        <McEditor value={mc} onChange={setMc} />
      )}

      {error && (
        <p role="alert" className="text-brand text-sm font-medium mt-2">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !canSubmit} className={`${btnPrimary} mt-3`}>
        {busy ? "Adding…" : "Add question"}
      </button>
    </form>
  );
}
