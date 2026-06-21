// Admin: account actions — reset a delegate's attempts on a question, or clear their
// Telegram binding. (Promote/demote admin is handled via the delegates PATCH route.)
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    await requireAdmin();
    const b = (await req.json().catch(() => ({}))) as {
      action?: string;
      delegateId?: string;
      questionId?: string;
    };
    const delegateId = (b.delegateId ?? "").trim();
    if (!delegateId) return fail("Missing delegate", 400);
    const db = getDb();

    if (b.action === "reset_attempts") {
      const questionId = (b.questionId ?? "").trim();
      if (!questionId) return fail("Missing question", 400);
      // Clear attempts so they can retry. Any earned point stays in the (append-only) ledger;
      // the answer route won't double-award.
      const { error } = await db
        .from("submissions")
        .delete()
        .eq("delegate_id", delegateId)
        .eq("question_id", questionId);
      if (error) throw error;
      return ok({ reset: true });
    }

    if (b.action === "clear_binding") {
      const { error } = await db.from("delegates").update({ telegram_id: null }).eq("id", delegateId);
      if (error) throw error;
      return ok({ cleared: true });
    }

    return fail("Unknown action", 400);
  });
}
