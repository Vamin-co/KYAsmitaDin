// Submit a trivia answer. Two attempts per question; a correct answer (attempt 1 or 2)
// appends exactly one +1 ledger row (idempotent). No hints.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireDelegate } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";
import { isAcceptedAnswer, normalizeAnswer } from "@/lib/answer";
import { getDelegateStats } from "@/lib/queries";
import type { Question, Submission } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    const delegate = await requireDelegate();
    const body = (await req.json().catch(() => ({}))) as { questionId?: string; answer?: string };
    const questionId = (body.questionId ?? "").trim();
    const rawAnswer = (body.answer ?? "").trim();
    if (!questionId) return fail("Missing question", 400);
    if (!rawAnswer) return fail("Type an answer first", 400);

    const db = getDb();
    const { data: qData } = await db
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .maybeSingle();
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

    if (correct) {
      // Append +1 once per (delegate, question).
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

    const attemptsLeft = correct ? 0 : 2 - attemptNo;
    const finished = correct || attemptsLeft === 0;
    const stats = await getDelegateStats(delegate.id);
    return ok({ correct, attemptNo, attemptsLeft, finished, stats });
  });
}
