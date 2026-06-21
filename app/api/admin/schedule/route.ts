// Admin: adjust a schedule block's start/end time at runtime. The admin-controlled
// schedule is the source of truth; this cascades to the personalized schedule + menu reveals.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";

export const runtime = "nodejs";

function validTime(t: unknown): t is string {
  return typeof t === "string" && /^\d{1,2}:\d{2}$/.test(t);
}

export async function PATCH(req: NextRequest) {
  return guard(async () => {
    await requireAdmin();
    const b = (await req.json().catch(() => ({}))) as { id?: number; start?: string; end?: string };
    const id = Number(b.id);
    if (!Number.isInteger(id)) return fail("Missing block id", 400);
    const patch: Record<string, string> = {};
    if (b.start !== undefined) {
      if (!validTime(b.start)) return fail("Start must be HH:MM", 400);
      patch.start_time = b.start;
    }
    if (b.end !== undefined) {
      if (!validTime(b.end)) return fail("End must be HH:MM", 400);
      patch.end_time = b.end;
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update", 400);

    const db = getDb();
    const { data, error } = await db.from("schedule_blocks").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return ok({ block: data });
  });
}
