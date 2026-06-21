import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/supabase";
import { getQuestionSubmissions } from "@/lib/queries";
import { SubmissionsPanel } from "@/components/admin/SubmissionsPanel";
import { StatusPill, IconArrowLeft } from "@/components/ui";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const { data } = await db.from("questions").select("*").eq("id", id).maybeSingle();
  const question = data as Question | null;
  if (!question) notFound();

  const rows = await getQuestionSubmissions(id);
  const credited = rows.filter((r) => r.credited).length;

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand active:opacity-70 tap mb-3"
      >
        <IconArrowLeft size={16} /> All questions
      </Link>

      <div className="bg-card rounded-2xl border border-line p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-ink leading-snug">{question.prompt}</p>
          <div className="flex items-center gap-2 shrink-0">
            {question.type === "multiple_choice" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-paper border border-line rounded-full px-2 py-0.5">
                MC
              </span>
            )}
            <StatusPill status={question.status} />
          </div>
        </div>
        {question.type === "multiple_choice" ? (
          <div className="mt-2 space-y-1">
            {(question.options ?? []).map((opt, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 border ${
                  i === question.correct_option
                    ? "bg-success-soft border-success/30 text-success font-semibold"
                    : "bg-paper border-line text-muted"
                }`}
              >
                {i === question.correct_option && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                )}
                <span>{opt}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {question.accepted_answers.map((a, i) => (
              <span key={i} className="text-xs bg-paper border border-line rounded-full px-2.5 py-1 text-muted">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold text-ink">Submissions</h2>
        <span className="text-muted text-sm">
          {rows.length} delegate{rows.length === 1 ? "" : "s"} · {credited} credited
        </span>
      </div>
      <SubmissionsPanel questionId={id} rows={rows} />
    </div>
  );
}
