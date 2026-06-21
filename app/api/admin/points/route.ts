// Admin: manual points adjustment (+/-) with an optional reason. Writes a
// `manual_adjustment` ledger row.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      delegateId?: string;
      delta?: number;
      note?: string;
    };
    const delegateId = (body.delegateId ?? "").trim();
    const delta = Number(body.delta);
    if (!delegateId) return fail("Missing delegate", 400);
    if (!Number.isInteger(delta) || delta === 0) return fail("Delta must be a non-zero integer", 400);

    const db = getDb();
    const { error } = await db.from("points_ledger").insert({
      delegate_id: delegateId,
      delta,
      source: "manual_adjustment",
      reference_question_id: null,
      note: body.note?.trim() || null,
      actor: admin.id,
    });
    if (error) throw error;
    return ok({ applied: true });
  });
}
