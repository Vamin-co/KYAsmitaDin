import { getSessionDelegate } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOpenQuestions, getDelegateStats, getDelegateSubmissions, getDelegateLedger } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { TriviaScreen, type Attempt } from "@/components/TriviaScreen";

export const dynamic = "force-dynamic";

export default async function TriviaPage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  const [questions, stats, allSubs, ledger] = await Promise.all([
    getOpenQuestions(),
    getDelegateStats(delegate.id),
    getDelegateSubmissions(delegate.id),
    getDelegateLedger(delegate.id),
  ]);

  const initialAttempts: Record<string, Attempt[]> = {};
  for (const q of questions) {
    initialAttempts[q.id] = allSubs
      .filter((s) => s.question_id === q.id)
      .sort((a, b) => a.attempt_no - b.attempt_no)
      .map((s) => ({ attempt_no: s.attempt_no, raw_answer: s.raw_answer, is_correct: s.is_correct }));
  }

  // Positive crediting ledger rows for question-level display (question_correct or correction).
  const openIds = new Set(questions.map((q) => q.id));
  const creditedQuestionIds = [
    ...new Set(
      ledger
        .filter(
          (l) =>
            (l.source === "question_correct" || l.source === "correction") &&
            l.delta > 0 &&
            l.reference_question_id &&
            openIds.has(l.reference_question_id),
        )
        .map((l) => l.reference_question_id as string),
    ),
  ];

  return (
    <>
      <PageHeader title="Trivia" subtitle="Optional — answer for points" />
      <TriviaScreen
        questions={questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type ?? "text",
          options: q.options ?? [],
        }))}
        initialAttempts={initialAttempts}
        initialStats={{ score: stats.score, current: stats.streak.current, longest: stats.streak.longest }}
        creditedQuestionIds={creditedQuestionIds}
      />
    </>
  );
}
