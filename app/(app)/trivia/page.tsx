import { getSessionDelegate } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOpenQuestions, getDelegateStats, getDelegateSubmissions } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { TriviaScreen, type Attempt } from "@/components/TriviaScreen";

export const dynamic = "force-dynamic";

export default async function TriviaPage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  const [questions, stats, allSubs] = await Promise.all([
    getOpenQuestions(),
    getDelegateStats(delegate.id),
    getDelegateSubmissions(delegate.id),
  ]);

  const initialAttempts: Record<string, Attempt[]> = {};
  for (const q of questions) {
    initialAttempts[q.id] = allSubs
      .filter((s) => s.question_id === q.id)
      .sort((a, b) => a.attempt_no - b.attempt_no)
      .map((s) => ({ attempt_no: s.attempt_no, raw_answer: s.raw_answer, is_correct: s.is_correct }));
  }

  return (
    <>
      <PageHeader title="Trivia" subtitle="Optional — answer for points" />
      <TriviaScreen
        questions={questions.map((q) => ({ id: q.id, prompt: q.prompt }))}
        initialAttempts={initialAttempts}
        initialStats={{ score: stats.score, current: stats.streak.current, longest: stats.streak.longest }}
      />
    </>
  );
}
