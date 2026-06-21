// Submit a trivia answer.
//  - Free-text: two attempts; correct on attempt 1 or 2 appends exactly one +1 ledger row.
//  - Multiple-choice: one attempt (the selection is the answer); correct if the selected option
//    is the correct one (no text normalization). Point award + streak are identical to text.
// Idempotent; the points ledger is append-only.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireDelegate } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";
import { isAcceptedAnswer, normalizeAnswer } from "@/lib/answer";
import { isMcCorrect } from "@/lib/question";
import { getDelegateStats } from "@/lib/queries";
import type { Question, Submission } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    const delegate = await requireDelegate();
    const body = (await req.json().catch(() => ({}))) as {
      questionId?: string;
      answer?: string;
      optionIndex?: number;
    };
    const questionId = (body.questionId ?? "").trim();
    if (!questionId) return fail("Missing question", 400);

    const db = getDb();
    const { data: qData } = await db.from("questions").select("*").eq("id", questionId).maybeSingle();
    const question = qData as Question | null;
    if (!question) return fail("Question not found", 404);
    if (question.status !== "open") return fail("This question is closed", 409);

    const { data: subData } = await db
      .from("submissions")
      .select("*")
      .eq("question_id", questionId)
      .eq("delegate_id", delegate.id)
      .order("attempt_no", { ascending: true });
    const subs = (subData ?? []) as Submission[];

    // Append +1 once per (delegate, question) — shared by text and MC, append-only.
    async function awardOnce() {
      const { data: existing } = await db
        .from("points_ledger")
        .select("id")
        .eq("delegate_id", delegate.id)
        .eq("reference_question_id", questionId)
        .eq("source", "question_correct")
        .limit(1);
      if (!existing || existing.length === 0) {
        await db.from("points_ledger").insert({
          delegate_id: delegate.id,
          delta: 1,
          source: "question_correct",
          reference_question_id: questionId,
          note: null,
          actor: "system",
        });
      }
    }

    // ---------------- multiple-choice: single attempt, index-based correctness ----------------
    if (question.type === "multiple_choice") {
      if (subs.some((s) => s.is_correct)) {
        const stats = await getDelegateStats(delegate.id);
        return ok({ correct: true, alreadyAnswered: true, attemptsLeft: 0, finished: true, stats });
      }
      if (subs.length >= 1) {
        const stats = await getDelegateStats(delegate.id);
        return ok({ correct: false, noAttemptsLeft: true, attemptsLeft: 0, finished: true, stats });
      }
      const options = question.options ?? [];
      const idx = Number(body.optionIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
        return fail("Pick an option", 400);
      }
      const correct = isMcCorrect(idx, question.correct_option);
      const label = options[idx];
      const { error: insErr } = await db.from("submissions").insert({
        question_id: questionId,
        delegate_id: delegate.id,
        attempt_no: 1,
        raw_answer: label,
        normalized_answer: normalizeAnswer(label),
        is_correct: correct,
      });
      if (insErr) {
        if (insErr.code === "23505") return fail("Answer already recorded — refresh", 409);
        throw insErr;
      }
      if (correct) await awardOnce();
      const stats = await getDelegateStats(delegate.id);
      return ok({ correct, attemptNo: 1, attemptsLeft: 0, finished: true, stats });
    }

    // ---------------- free-text: unchanged two-attempt behavior ----------------
    const rawAnswer = (body.answer ?? "").trim();
    if (!rawAnswer) return fail("Type an answer first", 400);

    if (subs.some((s) => s.is_correct)) {
      const stats = await getDelegateStats(delegate.id);
      return ok({ correct: true, alreadyAnswered: true, attemptsLeft: 0, finished: true, stats });
    }
    if (subs.length >= 2) {
      const stats = await getDelegateStats(delegate.id);
      return ok({ correct: false, noAttemptsLeft: true, attemptsLeft: 0, finished: true, stats });
    }

    const attemptNo = subs.length + 1;
    const correct = isAcceptedAnswer(rawAnswer, question.accepted_answers ?? []);

    const { error: insErr } = await db.from("submissions").insert({
      question_id: questionId,
      delegate_id: delegate.id,
      attempt_no: attemptNo,
      raw_answer: rawAnswer,
      normalized_answer: normalizeAnswer(rawAnswer),
      is_correct: correct,
    });
    if (insErr) {
      // Likely a duplicate attempt from a double-submit; treat idempotently.
      if (insErr.code === "23505") return fail("Attempt already recorded — refresh", 409);
      throw insErr;
    }

    if (correct) await awardOnce();

    const attemptsLeft = correct ? 0 : 2 - attemptNo;
    const finished = correct || attemptsLeft === 0;
    const stats = await getDelegateStats(delegate.id);
    return ok({ correct, attemptNo, attemptsLeft, finished, stats });
  });
}
