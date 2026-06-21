import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/supabase";
import { getDelegateLedger, getDelegateStats, getAllQuestions } from "@/lib/queries";
import { DelegateDetail, type HistoryRow } from "@/components/admin/DelegateDetail";
import { IconArrowLeft } from "@/components/ui";
import { fullName, type Delegate } from "@/lib/types";
import { EVENT_TZ } from "@/lib/time";

export const dynamic = "force-dynamic";

function whenLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: EVENT_TZ,
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function DelegateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { data } = await db.from("delegates").select("*").eq("id", id).maybeSingle();
  const d = data as Delegate | null;
  if (!d) notFound();

  const [ledger, stats, questions] = await Promise.all([
    getDelegateLedger(id),
    getDelegateStats(id),
    getAllQuestions(),
  ]);

  // Resolve actor names + referenced question prompts.
  const actorIds = [...new Set(ledger.map((l) => l.actor).filter((a) => a && a !== "system"))];
  const actorNames = new Map<string, string>();
  if (actorIds.length) {
    const { data: actors } = await db.from("delegates").select("*").in("id", actorIds);
    for (const a of (actors ?? []) as Delegate[]) actorNames.set(a.id, fullName(a));
  }
  const qTitle = new Map(questions.map((q) => [q.id, q.prompt]));

  const history: HistoryRow[] = ledger.map((l) => ({
    id: l.id,
    delta: l.delta,
    source: l.source,
    note: l.note,
    when: whenLabel(l.created_at),
    actorLabel: l.actor === "system" ? "system" : actorNames.get(l.actor) ?? "admin",
    refLabel: l.reference_question_id ? truncate(qTitle.get(l.reference_question_id)) : null,
  }));

  return (
    <div>
      <Link
        href="/admin/delegates"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand active:opacity-70 tap mb-4"
      >
        <IconArrowLeft size={16} /> All delegates
      </Link>
      <DelegateDetail
        delegate={{
          id: d.id,
          misId: d.mis_id,
          name: fullName(d),
          firstName: d.first_name,
          middleName: d.middle_name ?? "",
          lastName: d.last_name,
          wing: d.wing,
          mandal: d.mandal,
          subgroup: d.subgroup ?? "",
          center: d.center,
          goshthiGroup: d.goshthi_group,
          track: d.track,
          isAdmin: d.is_admin,
          isActive: d.is_active,
          hasBinding: d.telegram_id != null,
        }}
        stats={{ score: stats.score, current: stats.streak.current, longest: stats.streak.longest }}
        history={history}
      />
    </div>
  );
}

function truncate(s: string | undefined): string | null {
  if (!s) return null;
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}
