// Focused unit tests for MC + regraded-state patch.
// Pure logic only — no DB, no UI, no live data.

import { describe, it, expect } from "vitest";
import { validateMc, isMcCorrect } from "@/lib/question";
import { isAcceptedAnswer, normalizeAnswer } from "@/lib/answer";
import {
  computeScore,
  computeStreaks,
  questionOutcome,
  type QuestionRow,
  type SubmissionRow,
  type LedgerRow,
} from "@/lib/scoring";

// ---------------------------------------------------------------------------
// validateMc
// ---------------------------------------------------------------------------
describe("validateMc", () => {
  it("passes with 2 valid options and correct index 0", () => {
    const r = validateMc(["Alpha", "Beta"], 0);
    expect(r.ok).toBe(true);
    expect(r.options).toEqual(["Alpha", "Beta"]);
  });

  it("passes with 5 valid options and correct index 4", () => {
    const r = validateMc(["A", "B", "C", "D", "E"], 4);
    expect(r.ok).toBe(true);
    expect(r.options).toHaveLength(5);
  });

  it("trims option text", () => {
    const r = validateMc(["  Alpha  ", " Beta "], 1);
    expect(r.ok).toBe(true);
    expect(r.options).toEqual(["Alpha", "Beta"]);
  });

  it("rejects fewer than 2 options", () => {
    expect(validateMc(["Only one"], 0).ok).toBe(false);
    expect(validateMc([], 0).ok).toBe(false);
  });

  it("rejects empty option text", () => {
    expect(validateMc(["Alpha", ""], 0).ok).toBe(false);
    expect(validateMc(["", "Beta"], 0).ok).toBe(false);
    expect(validateMc(["Alpha", "  "], 0).ok).toBe(false);
  });

  it("rejects no correct option (index -1)", () => {
    expect(validateMc(["A", "B"], -1).ok).toBe(false);
  });

  it("rejects correct index out of range", () => {
    expect(validateMc(["A", "B"], 2).ok).toBe(false);
    expect(validateMc(["A", "B"], 99).ok).toBe(false);
  });

  it("rejects non-integer correct index", () => {
    expect(validateMc(["A", "B"], 0.5).ok).toBe(false);
    expect(validateMc(["A", "B"], NaN).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isMcCorrect
// ---------------------------------------------------------------------------
describe("isMcCorrect", () => {
  it("returns true when indices match", () => {
    expect(isMcCorrect(0, 0)).toBe(true);
    expect(isMcCorrect(3, 3)).toBe(true);
  });

  it("returns false when indices differ", () => {
    expect(isMcCorrect(0, 1)).toBe(false);
    expect(isMcCorrect(2, 0)).toBe(false);
  });

  it("returns false for null/undefined correct option", () => {
    expect(isMcCorrect(0, null)).toBe(false);
    expect(isMcCorrect(0, undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// questionOutcome — MC vs text resolved thresholds
// ---------------------------------------------------------------------------
describe("questionOutcome", () => {
  const openText: QuestionRow = { id: "q1", status: "open", opened_at: "2026-01-01T00:00:00Z" };
  const openMc: QuestionRow = { id: "q2", status: "open", opened_at: "2026-01-01T00:00:00Z", type: "multiple_choice" };
  const closedText: QuestionRow = { id: "q3", status: "closed", opened_at: "2026-01-01T00:00:00Z" };

  it("text: 1 wrong submission is still pending (has a second attempt)", () => {
    const subs: SubmissionRow[] = [{ question_id: "q1", attempt_no: 1, is_correct: false }];
    const { outcome } = questionOutcome(openText, subs, false);
    expect(outcome).toBe("pending");
  });

  it("text: 2 wrong submissions is resolved wrong", () => {
    const subs: SubmissionRow[] = [
      { question_id: "q1", attempt_no: 1, is_correct: false },
      { question_id: "q1", attempt_no: 2, is_correct: false },
    ];
    const { outcome } = questionOutcome(openText, subs, false);
    expect(outcome).toBe("wrong");
  });

  it("MC: 1 wrong submission is resolved wrong (single attempt)", () => {
    const subs: SubmissionRow[] = [{ question_id: "q2", attempt_no: 1, is_correct: false }];
    const { outcome } = questionOutcome(openMc, subs, false);
    expect(outcome).toBe("wrong");
  });

  it("MC: correct submission is correct", () => {
    const subs: SubmissionRow[] = [{ question_id: "q2", attempt_no: 1, is_correct: true }];
    const { outcome } = questionOutcome(openMc, subs, false);
    expect(outcome).toBe("correct");
  });

  it("text: correct on attempt 2 is correct", () => {
    const subs: SubmissionRow[] = [
      { question_id: "q1", attempt_no: 1, is_correct: false },
      { question_id: "q1", attempt_no: 2, is_correct: true },
    ];
    const { outcome } = questionOutcome(openText, subs, false);
    expect(outcome).toBe("correct");
  });

  it("credit overrides wrong submissions for both types", () => {
    const wrongSubs: SubmissionRow[] = [{ question_id: "q1", attempt_no: 1, is_correct: false }];
    expect(questionOutcome(openText, wrongSubs, true).outcome).toBe("correct");

    const wrongMc: SubmissionRow[] = [{ question_id: "q2", attempt_no: 1, is_correct: false }];
    expect(questionOutcome(openMc, wrongMc, true).outcome).toBe("correct");
  });

  it("closed question with wrong submissions is resolved wrong", () => {
    const subs: SubmissionRow[] = [{ question_id: "q3", attempt_no: 1, is_correct: false }];
    const { outcome } = questionOutcome(closedText, subs, false);
    expect(outcome).toBe("wrong");
  });

  it("no submissions means not engaged", () => {
    const { engaged, outcome } = questionOutcome(openText, [], false);
    expect(engaged).toBe(false);
    expect(outcome).toBe("pending");
  });

  it("type defaults to text when absent", () => {
    const noType: QuestionRow = { id: "q9", status: "open", opened_at: "2026-01-01T00:00:00Z" };
    const subs: SubmissionRow[] = [{ question_id: "q9", attempt_no: 1, is_correct: false }];
    // With no type, should use text threshold (2 attempts), so 1 wrong = pending
    const { outcome } = questionOutcome(noType, subs, false);
    expect(outcome).toBe("pending");
  });
});

// ---------------------------------------------------------------------------
// computeStreaks — MC correct counts toward streak like text
// ---------------------------------------------------------------------------
describe("computeStreaks with MC", () => {
  it("MC correct answer counts toward streak", () => {
    const questions: QuestionRow[] = [
      { id: "q1", status: "closed", opened_at: "2026-01-01T00:00:00Z" },
      { id: "q2", status: "closed", opened_at: "2026-01-01T01:00:00Z", type: "multiple_choice" },
      { id: "q3", status: "closed", opened_at: "2026-01-01T02:00:00Z" },
    ];
    const subs: SubmissionRow[] = [
      { question_id: "q1", attempt_no: 1, is_correct: true },
      { question_id: "q2", attempt_no: 1, is_correct: true },
      { question_id: "q3", attempt_no: 1, is_correct: true },
    ];
    const ledger: LedgerRow[] = [
      { delta: 1, source: "question_correct", reference_question_id: "q1" },
      { delta: 1, source: "question_correct", reference_question_id: "q2" },
      { delta: 1, source: "question_correct", reference_question_id: "q3" },
    ];
    const result = computeStreaks(questions, subs, ledger);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("MC wrong answer breaks streak", () => {
    const questions: QuestionRow[] = [
      { id: "q1", status: "closed", opened_at: "2026-01-01T00:00:00Z" },
      { id: "q2", status: "closed", opened_at: "2026-01-01T01:00:00Z", type: "multiple_choice" },
      { id: "q3", status: "closed", opened_at: "2026-01-01T02:00:00Z" },
    ];
    const subs: SubmissionRow[] = [
      { question_id: "q1", attempt_no: 1, is_correct: true },
      { question_id: "q2", attempt_no: 1, is_correct: false }, // MC wrong = streak break
      { question_id: "q3", attempt_no: 1, is_correct: true },
    ];
    const ledger: LedgerRow[] = [
      { delta: 1, source: "question_correct", reference_question_id: "q1" },
      { delta: 1, source: "question_correct", reference_question_id: "q3" },
    ];
    const result = computeStreaks(questions, subs, ledger);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it("regraded question counts as correct for streak", () => {
    const questions: QuestionRow[] = [
      { id: "q1", status: "closed", opened_at: "2026-01-01T00:00:00Z" },
      { id: "q2", status: "closed", opened_at: "2026-01-01T01:00:00Z" },
    ];
    const subs: SubmissionRow[] = [
      { question_id: "q1", attempt_no: 1, is_correct: true },
      { question_id: "q2", attempt_no: 1, is_correct: false },
      { question_id: "q2", attempt_no: 2, is_correct: false },
    ];
    // q2 was wrong but got a correction ledger entry
    const ledger: LedgerRow[] = [
      { delta: 1, source: "question_correct", reference_question_id: "q1" },
      { delta: 1, source: "correction", reference_question_id: "q2" },
    ];
    const result = computeStreaks(questions, subs, ledger);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeScore — unchanged behavior
// ---------------------------------------------------------------------------
describe("computeScore", () => {
  it("sums ledger deltas", () => {
    expect(computeScore([
      { delta: 1, source: "question_correct", reference_question_id: "q1" },
      { delta: 1, source: "question_correct", reference_question_id: "q2" },
      { delta: -1, source: "manual_adjustment", reference_question_id: null },
    ])).toBe(1);
  });

  it("returns 0 for empty ledger", () => {
    expect(computeScore([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Free-text answer matching — unchanged behavior
// ---------------------------------------------------------------------------
describe("isAcceptedAnswer (free-text, unchanged)", () => {
  it("matches exact normalized answer", () => {
    expect(isAcceptedAnswer("1781", ["1781"])).toBe(true);
  });

  it("matches case insensitively", () => {
    expect(isAcceptedAnswer("Ahmedabad", ["ahmedabad"])).toBe(true);
  });

  it("strips punctuation", () => {
    // Periods become spaces, so "C.E." normalizes to "c e"
    expect(isAcceptedAnswer("1781 C.E.", ["1781 c e"])).toBe(true);
  });

  it("matches comma lists in any order", () => {
    expect(isAcceptedAnswer("B, A", ["A, B"])).toBe(true);
  });

  it("rejects wrong answers", () => {
    expect(isAcceptedAnswer("1782", ["1781"])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizeAnswer — unchanged behavior
// ---------------------------------------------------------------------------
describe("normalizeAnswer (unchanged)", () => {
  it("lowercases and trims", () => {
    expect(normalizeAnswer("  Hello World  ")).toBe("hello world");
  });

  it("collapses whitespace", () => {
    expect(normalizeAnswer("a   b   c")).toBe("a b c");
  });

  it("strips punctuation", () => {
    expect(normalizeAnswer("hello, world!")).toBe("hello world");
  });
});
