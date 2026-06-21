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

// For comma-separated list answers where order doesn't matter: split on commas, normalize
// each token, drop empties, and build a stable key from the sorted token list (joined with a
// "|" separator that cannot appear in a normalized token, so token boundaries cannot collide).
// Two answers with the same tokens in any order yield the same key. Exact-after-normalization
// only — no fuzzy matching.
function tokenSetKey(input: string): string {
  return input
    .split(",")
    .map(normalizeAnswer)
    .filter(Boolean)
    .sort()
    .join("|");
}

// True if the (raw) answer matches any accepted answer, by EITHER:
//   - whole-string normalized equality (fallback for non-list answers), or
//   - order-independent comma-token-set equality (for list answers).
export function isAcceptedAnswer(rawAnswer: string, acceptedAnswers: string[]): boolean {
  const whole = normalizeAnswer(rawAnswer);
  const subKey = tokenSetKey(rawAnswer);
  for (const acc of acceptedAnswers) {
    if (whole && normalizeAnswer(acc) === whole) return true;
    if (subKey && tokenSetKey(acc) === subKey) return true;
  }
  return false;
}
