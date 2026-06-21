import { getAllQuestions } from "@/lib/queries";
import { NewQuestion } from "@/components/admin/NewQuestion";
import { QuestionList } from "@/components/admin/QuestionList";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestions();
  const open = questions.filter((q) => q.status === "open").length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Trivia questions</h1>
        <span className="text-muted text-sm">
          {questions.length} total · {open} live
        </span>
      </div>
      <NewQuestion />
      <QuestionList questions={questions} />
    </div>
  );
}
