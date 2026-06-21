// Admin: create / edit / open / close questions.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";
import { isAcceptedAnswer } from "@/lib/answer";

export const runtime = "nodejs";

function cleanAnswers(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((a) => String(a).trim())
    .filter((a) => a.length > 0);
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      prompt?: string;
      acceptedAnswers?: string[];
      sortOrder?: number;
    };
    const prompt = (body.prompt ?? "").trim();
    if (!prompt) return fail("Question text is required", 400);
    const accepted = cleanAnswers(body.acceptedAnswers);
    if (accepted.length === 0) return fail("Add at least one accepted answer", 400);

    const db = getDb();
    const { data, error } = await db
      .from("questions")
      .insert({
        prompt,
        accepted_answers: accepted,
        status: "draft",
        sort_order: body.sortOrder ?? 0,
        created_by: admin.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok({ question: data });
  });
}

export async function PATCH(req: NextRequest) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      prompt?: string;
      acceptedAnswers?: string[];
      status?: "draft" | "open" | "closed";
    };
    const id = (body.id ?? "").trim();
    if (!id) return fail("Missing question id", 400);

    const db = getDb();
    const patch: Record<string, unknown> = {};
    if (typeof body.prompt === "string") {
      const p = body.prompt.trim();
      if (!p) return fail("Question text cannot be empty", 400);
      patch.prompt = p;
    }
    if (body.acceptedAnswers) {
      const accepted = cleanAnswers(body.acceptedAnswers);
      if (accepted.length === 0) return fail("Add at least one accepted answer", 400);
      patch.accepted_answers = accepted;
    }
    if (body.status) {
      patch.status = body.status;
      // Multiple questions may be open at once — opening one does not close others.
      if (body.status === "open") patch.opened_at = new Date().toISOString();
      if (body.status === "closed") patch.closed_at = new Date().toISOString();
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update", 400);

    const { data, error } = await db
      .from("questions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    // Re-grade on accepted-answers edit: credit any delegate whose existing submission now
    // matches but who is NOT already credited for this question. Idempotent, append-only.
    let regrade: { newlyCredited: number } | undefined;
    if (body.acceptedAnswers) {
      const accepted = patch.accepted_answers as string[];
      const [{ data: subData }, { data: ledData }] = await Promise.all([
        db.from("submissions").select("delegate_id, raw_answer").eq("question_id", id),
        db
          .from("points_ledger")
          .select("delegate_id")
          .eq("reference_question_id", id)
          .in("source", ["question_correct", "correction"]),
      ]);
      const credited = new Set((ledData ?? []).map((r) => (r as { delegate_id: string }).delegate_id));
      const toAward = new Set<string>();
      for (const s of (subData ?? []) as { delegate_id: string; raw_answer: string }[]) {
        if (credited.has(s.delegate_id) || toAward.has(s.delegate_id)) continue;
        if (isAcceptedAnswer(s.raw_answer, accepted)) toAward.add(s.delegate_id);
      }

      let n = 0;
      for (const delegateId of toAward) {
        // Re-check immediately before inserting (never double-award).
        const { data: existing } = await db
          .from("points_ledger")
          .select("id")
          .eq("delegate_id", delegateId)
          .eq("reference_question_id", id)
          .in("source", ["question_correct", "correction"])
          .limit(1);
        if (existing && existing.length) continue;
        const { error: insErr } = await db.from("points_ledger").insert({
          delegate_id: delegateId,
          delta: 1,
          source: "question_correct",
          reference_question_id: id,
          note: "Re-graded after accepted answers updated",
          actor: admin.id,
        });
        if (!insErr) n++;
      }
      regrade = { newlyCredited: n };
    }

    return ok({ question: data, ...(regrade ? { regrade } : {}) });
  });
}
