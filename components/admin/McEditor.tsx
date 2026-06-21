"use client";

import { inputSm, IconPlus, IconX } from "@/components/ui";

export interface McValue {
  options: string[];
  correctIndex: number | null;
}

// Controlled editor for multiple-choice options: start with 2, add unlimited, remove (never
// below 2), mark exactly one correct (radio). Removing shifts the correct index correctly.
export function McEditor({ value, onChange }: { value: McValue; onChange: (v: McValue) => void }) {
  const { options, correctIndex } = value;

  const setOption = (i: number, text: string) =>
    onChange({ options: options.map((o, j) => (j === i ? text : o)), correctIndex });

  const addOption = () => onChange({ options: [...options, ""], correctIndex });

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, j) => j !== i);
    let ci = correctIndex;
    if (ci === i) ci = null;
    else if (ci != null && i < ci) ci = ci - 1;
    onChange({ options: next, correctIndex: ci });
  };

  const setCorrect = (i: number) => onChange({ options, correctIndex: i });

  return (
    <div>
      <span className="block text-sm font-medium text-ink mb-1">
        Options <span className="text-muted font-normal">(mark the correct one)</span>
      </span>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="mc-correct"
              aria-label={`Mark option ${i + 1} correct`}
              checked={correctIndex === i}
              onChange={() => setCorrect(i)}
              className="size-4 accent-[var(--color-success)] shrink-0 cursor-pointer"
            />
            <input
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className={`${inputSm} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={options.length <= 2}
              aria-label={`Remove option ${i + 1}`}
              className="size-8 grid place-items-center rounded-lg border border-line text-muted disabled:opacity-40 active:scale-95 transition-transform tap shrink-0"
            >
              <IconX size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand active:opacity-70 tap"
      >
        <IconPlus size={16} /> Add option
      </button>
    </div>
  );
}
