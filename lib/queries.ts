// Server-side data access (service role). Used by server components + route handlers.
import "server-only";
import { getDb } from "./supabase";
import { computeScore, computeStreaks, type StreakResult } from "./scoring";
import type {
  Delegate,
  LedgerEntry,
  MenuSection,
  Question,
  ScheduleBlock,
  Submission,
} from "./types";

export async function getScheduleBlocks(): Promise<ScheduleBlock[]> {
  const db = getDb();
  const { data, error } = await db
    .from("schedule_blocks")
    .select("*")
    .order("start_time", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScheduleBlock[];
}

export async function getMenuSections(): Promise<MenuSection[]> {
  const db = getDb();
  const { data, error } = await db
    .from("menu_sections")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MenuSection[];
}

export async function getAllQuestions(): Promise<Question[]> {
  const db = getDb();
  const { data, error } = await db
    .from("questions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Question[];
}

export async function getOpenQuestion(): Promise<Question | null> {
  const db = getDb();
  const { data, error } = await db
    .from("questions")
    .select("*")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Question) ?? null;
}

export async function getDelegateSubmissions(delegateId: string): Promise<Submission[]> {
  const db = getDb();
  const { data, error } = await db
    .from("submissions")
    .select("*")
    .eq("delegate_id", delegateId);
  if (error) throw error;
  return (data ?? []) as Submission[];
}

export async function getDelegateLedger(delegateId: string): Promise<LedgerEntry[]> {
  const db = getDb();
  const { data, error } = await db
    .from("points_ledger")
    .select("*")
    .eq("delegate_id", delegateId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LedgerEntry[];
}

export interface DelegateStats {
  score: number;
  streak: StreakResult;
}

export async function getDelegateStats(delegateId: string): Promise<DelegateStats> {
  const [questions, submissions, ledger] = await Promise.all([
    getAllQuestions(),
    getDelegateSubmissions(delegateId),
    getDelegateLedger(delegateId),
  ]);
  const score = computeScore(ledger);
  const streak = computeStreaks(
    questions.map((q) => ({ id: q.id, status: q.status, opened_at: q.opened_at })),
    submissions.map((s) => ({
      question_id: s.question_id,
      attempt_no: s.attempt_no,
      is_correct: s.is_correct,
    })),
    ledger.map((l) => ({
      delta: l.delta,
      source: l.source,
      reference_question_id: l.reference_question_id,
    })),
  );
  return { score, streak };
}

export async function getAllDelegates(includeInactive = true): Promise<Delegate[]> {
  const db = getDb();
  let q = db.from("delegates").select("*").order("mis_id", { ascending: true });
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Delegate[];
}

export interface StandingRow {
  delegate: Delegate;
  score: number;
  current: number;
  longest: number;
}

// Admin-only competitive view: every delegate by score + streak (computed in one place).
export async function getStandings(): Promise<StandingRow[]> {
  const db = getDb();
  const [delegates, questions, subs, ledger] = await Promise.all([
    getAllDelegates(true),
    getAllQuestions(),
    db.from("submissions").select("*").then((r) => (r.data ?? []) as Submission[]),
    db.from("points_ledger").select("*").then((r) => (r.data ?? []) as LedgerEntry[]),
  ]);

  const qLite = questions.map((q) => ({ id: q.id, status: q.status, opened_at: q.opened_at }));
  const rows: StandingRow[] = delegates.map((d) => {
    const dSubs = subs
      .filter((s) => s.delegate_id === d.id)
      .map((s) => ({ question_id: s.question_id, attempt_no: s.attempt_no, is_correct: s.is_correct }));
    const dLedger = ledger
      .filter((l) => l.delegate_id === d.id)
      .map((l) => ({ delta: l.delta, source: l.source, reference_question_id: l.reference_question_id }));
    const score = computeScore(dLedger);
    const streak = computeStreaks(qLite, dSubs, dLedger);
    return { delegate: d, score, current: streak.current, longest: streak.longest };
  });

  rows.sort((a, b) => b.score - a.score || b.longest - a.longest || b.current - a.current);
  return rows;
}

export interface SubmissionView {
  delegateId: string;
  name: string;
  misId: string;
  attempts: { attempt_no: number; raw_answer: string; is_correct: boolean }[];
  anyCorrect: boolean;
  credited: boolean; // earned a point (auto or correction)
}

// Per-question: every delegate's attempts + whether they've been credited (for corrections).
export async function getQuestionSubmissions(questionId: string): Promise<SubmissionView[]> {
  const db = getDb();
  const [{ data: subData }, { data: ledgerData }, delegates] = await Promise.all([
    db.from("submissions").select("*").eq("question_id", questionId),
    db
      .from("points_ledger")
      .select("delegate_id")
      .eq("reference_question_id", questionId)
      .in("source", ["question_correct", "correction"]),
    getAllDelegates(true),
  ]);

  const subs = (subData ?? []) as Submission[];
  const credited = new Set((ledgerData ?? []).map((r) => (r as { delegate_id: string }).delegate_id));
  const byId = new Map(delegates.map((d) => [d.id, d]));

  const grouped = new Map<string, SubmissionView>();
  for (const s of subs) {
    const d = byId.get(s.delegate_id);
    if (!d) continue;
    let row = grouped.get(s.delegate_id);
    if (!row) {
      row = {
        delegateId: s.delegate_id,
        name: fullNameOf(d),
        misId: d.mis_id,
        attempts: [],
        anyCorrect: false,
        credited: credited.has(s.delegate_id),
      };
      grouped.set(s.delegate_id, row);
    }
    row.attempts.push({ attempt_no: s.attempt_no, raw_answer: s.raw_answer, is_correct: s.is_correct });
    if (s.is_correct) row.anyCorrect = true;
  }
  const out = [...grouped.values()];
  out.forEach((r) => r.attempts.sort((a, b) => a.attempt_no - b.attempt_no));
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

function fullNameOf(d: Delegate): string {
  const mid = d.middle_name && d.middle_name !== "--" ? ` ${d.middle_name}` : "";
  return `${d.first_name}${mid} ${d.last_name}`.trim();
}
