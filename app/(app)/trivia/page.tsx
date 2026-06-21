import { getSessionDelegate } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOpenQuestion, getDelegateStats, getDelegateSubmissions } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { TriviaScreen } from "@/components/TriviaScreen";

export const dynamic = "force-dynamic";

export default async function TriviaPage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  const [question, stats, allSubs] = await Promise.all([
    getOpenQuestion(),
    getDelegateStats(delegate.id),
    getDelegateSubmissions(delegate.id),
  ]);

  const attempts = question
    ? allSubs
        .filter((s) => s.question_id === question.id)
        .sort((a, b) => a.attempt_no - b.attempt_no)
        .map((s) => ({ attempt_no: s.attempt_no, raw_answer: s.raw_answer, is_correct: s.is_correct }))
    : [];

  return (
    <>
      <PageHeader title="Trivia" subtitle="Optional — answer for points" />
      <TriviaScreen
        question={question ? { id: question.id, prompt: question.prompt } : null}
        initialAttempts={attempts}
        initialStats={{ score: stats.score, current: stats.streak.current, longest: stats.streak.longest }}
      />
    </>
  );
}
