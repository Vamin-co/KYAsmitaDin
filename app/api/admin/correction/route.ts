// Admin: award a point for an answer that was right but didn't match the accepted set.
// Writes a `correction` ledger row (+1), idempotent per (delegate, question).
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      questionId?: string;
      delegateId?: string;
      note?: string;
    };
    const questionId = (body.questionId ?? "").trim();
    const delegateId = (body.delegateId ?? "").trim();
    if (!questionId || !delegateId) return fail("Missing question or delegate", 400);

    const db = getDb();

    // Already credited (auto-correct or prior correction)? Don't double-award.
    const [{ data: correctSub }, { data: prior }] = await Promise.all([
      db.from("submissions").select("id").eq("question_id", questionId)
        .eq("delegate_id", delegateId).eq("is_correct", true).limit(1),
      db.from("points_ledger").select("id").eq("delegate_id", delegateId)
        .eq("reference_question_id", questionId).in("source", ["question_correct", "correction"]).limit(1),
    ]);
    if ((correctSub && correctSub.length) || (prior && prior.length)) {
      return ok({ alreadyAwarded: true });
    }

    const { error } = await db.from("points_ledger").insert({
      delegate_id: delegateId,
      delta: 1,
      source: "correction",
      reference_question_id: questionId,
      note: body.note?.trim() || "Manual correction — answer accepted",
      actor: admin.id,
    });
    if (error) throw error;
    return ok({ awarded: true });
  });
}
