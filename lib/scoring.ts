// Scoring + streaks — the fixed rules from CLAUDE.md, in one shared module so delegate
// stats and admin standings can never drift.
//
// Score: sum of the append-only points ledger (NOT a running integer).
// Streak: consecutive QUESTIONS answered correctly, per-question (not per-attempt).
//   - correct if any attempt was correct OR a `correction` ledger row exists for it.
//   - missing attempt 1 but right on attempt 2 keeps the streak.
//   - breaks only when a question ends WRONG (both attempts used / question closed, no
//     correct answer, no correction).
//   - sequence = questions the delegate engaged with (>=1 submission), ordered by opened_at.

export type Source = "question_correct" | "manual_adjustment" | "correction";

export interface LedgerRow {
  delta: number;
  source: Source;
  reference_question_id: string | null;
}

export interface SubmissionRow {
  question_id: string;
  attempt_no: number;
  is_correct: boolean;
}

export interface QuestionRow {
  id: string;
  status: "draft" | "open" | "closed";
  opened_at: string | null;
}

export type Outcome = "correct" | "wrong" | "pending";

export function computeScore(ledger: LedgerRow[]): number {
  return ledger.reduce((sum, r) => sum + (r.delta ?? 0), 0);
}

// Per-question outcome for one delegate. A question counts as `correct` if any attempt was
// correct OR the delegate is credited for it (via manual correction or regrade) — credit makes
// the question correct in its original position even with no correct submission. `engaged`
// means the delegate either submitted or is credited, so a credited question always counts.
export function questionOutcome(
  question: QuestionRow,
  submissions: SubmissionRow[],
  hasCredit: boolean,
): { engaged: boolean; outcome: Outcome } {
  const subs = submissions.filter((s) => s.question_id === question.id);
  const engaged = subs.length > 0;
  const anyCorrect = subs.some((s) => s.is_correct);
  if (anyCorrect || hasCredit) return { engaged: true, outcome: "correct" };
  if (!engaged) return { engaged: false, outcome: "pending" };
  const resolved = subs.length >= 2 || question.status === "closed";
  return { engaged: true, outcome: resolved ? "wrong" : "pending" };
}

export interface StreakResult {
  current: number;
  longest: number;
}

// Compute current + longest streak for one delegate from their submissions + ledger.
export function computeStreaks(
  questions: QuestionRow[],
  submissions: SubmissionRow[],
  ledger: LedgerRow[],
): StreakResult {
  // A question is "credited" (counts as correct for the streak, in its original position) when
  // the delegate has a crediting ledger row for it — whether from a live-correct answer
  // (question_correct), an admin correction (correction), or a regrade (question_correct).
  const creditedQ = new Set(
    ledger
      .filter(
        (r) =>
          (r.source === "question_correct" || r.source === "correction") && r.reference_question_id,
      )
      .map((r) => r.reference_question_id as string),
  );

  // Resolved (non-pending) questions the delegate engaged with, ordered by opened_at.
  const ordered = [...questions]
    .filter((q) => q.opened_at)
    .sort((a, b) => (a.opened_at! < b.opened_at! ? -1 : a.opened_at! > b.opened_at! ? 1 : 0));

  const sequence: Outcome[] = [];
  for (const q of ordered) {
    const { engaged, outcome } = questionOutcome(q, submissions, creditedQ.has(q.id));
    if (!engaged || outcome === "pending") continue;
    sequence.push(outcome);
  }

  let longest = 0;
  let run = 0;
  for (const o of sequence) {
    if (o === "correct") {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // Current streak = trailing run of correct outcomes.
  let current = 0;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (sequence[i] === "correct") current += 1;
    else break;
  }

  return { current, longest };
}
