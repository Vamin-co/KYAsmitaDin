// Answer normalization for trivia matching (fixed by CLAUDE.md):
// trim, collapse internal whitespace, lowercase, strip punctuation.
// Applied identically to the delegate's answer and every accepted answer before comparing.

export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ") // punctuation + symbols -> space
    .replace(/\s+/g, " ")
    .trim();
}

// True if the (raw) answer matches any accepted answer after normalization.
export function isAcceptedAnswer(rawAnswer: string, acceptedAnswers: string[]): boolean {
  const a = normalizeAnswer(rawAnswer);
  if (!a) return false;
  return acceptedAnswers.some((acc) => normalizeAnswer(acc) === a);
}
