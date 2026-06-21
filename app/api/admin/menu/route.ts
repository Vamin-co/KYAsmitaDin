// Admin: manually reveal/hide a menu section, or clear the override (back to time-based).
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  return guard(async () => {
    await requireAdmin();
    const b = (await req.json().catch(() => ({}))) as { id?: string; manualState?: string | null };
    const id = (b.id ?? "").trim();
    if (!id) return fail("Missing section id", 400);
    const state = b.manualState;
    if (state !== null && state !== "reveal" && state !== "hide") {
      return fail("manualState must be reveal, hide, or null", 400);
    }
    const db = getDb();
    const { data, error } = await db
      .from("menu_sections")
      .update({ manual_state: state })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return ok({ section: data });
  });
}
