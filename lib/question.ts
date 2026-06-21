// Multiple-choice question helpers (additive, alongside free-text answer matching).
// MC questions have >= 2 options and exactly one correct option (by index). Correctness is by
// the selected index — no text normalization.

export type QuestionType = "text" | "multiple_choice";

export interface McValidation {
  ok: boolean;
  error?: string;
  options?: string[]; // trimmed options when ok
}

// Validate an MC question: at least 2 non-empty options and exactly one correct (a valid index).
export function validateMc(options: string[], correctOption: number): McValidation {
  const opts = (options ?? []).map((o) => (o ?? "").trim());
  if (opts.length < 2) return { ok: false, error: "Add at least 2 options" };
  if (opts.some((o) => o.length === 0)) return { ok: false, error: "Options cannot be empty" };
  if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption >= opts.length) {
    return { ok: false, error: "Mark exactly one correct option" };
  }
  return { ok: true, options: opts };
}

// An MC submission is correct iff the selected index equals the correct option index.
export function isMcCorrect(selectedIndex: number, correctOption: number | null | undefined): boolean {
  return (
    Number.isInteger(selectedIndex) &&
    typeof correctOption === "number" &&
    selectedIndex === correctOption
  );
}
