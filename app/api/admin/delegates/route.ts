// Admin: add a delegate, or edit/deactivate/promote one.
//  - POST  create (MIS ID becomes a valid login immediately — covers day-of walk-ins)
//  - PATCH update fields, is_active (deactivate = soft remove), is_admin (promote/demote)
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, guard } from "@/lib/http";
import { groupToTrack } from "@/lib/track";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    await requireAdmin();
    const b = (await req.json().catch(() => ({}))) as Record<string, string>;
    const misId = (b.misId ?? "").trim();
    if (!misId) return fail("MIS ID is required", 400);
    if (!(b.firstName ?? "").trim()) return fail("First name is required", 400);

    const wing = b.wing === "iSide" ? "iSide" : "eSide";
    const goshthi = (b.goshthiGroup ?? "").trim();
    const track = (b.track === "A" || b.track === "B" ? b.track : groupToTrack(goshthi)) ?? null;

    const db = getDb();
    const { data: existing } = await db.from("delegates").select("id").eq("mis_id", misId).maybeSingle();
    if (existing) return fail("A delegate with that MIS ID already exists", 409);

    const { data, error } = await db
      .from("delegates")
      .insert({
        mis_id: misId,
        first_name: (b.firstName ?? "").trim(),
        middle_name: (b.middleName ?? "").trim() || null,
        last_name: (b.lastName ?? "").trim(),
        wing,
        mandal: (b.mandal ?? "").trim(),
        subgroup: (b.subgroup ?? "").trim() || null,
        center: (b.center ?? "").trim(),
        goshthi_group: goshthi,
        track,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok({ delegate: data });
  });
}

export async function PATCH(req: NextRequest) {
  return guard(async () => {
    await requireAdmin();
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(b.id ?? "").trim();
    if (!id) return fail("Missing delegate id", 400);

    const patch: Record<string, unknown> = {};
    const setStr = (key: string, col: string) => {
      if (typeof b[key] === "string") patch[col] = (b[key] as string).trim() || null;
    };
    setStr("firstName", "first_name");
    setStr("middleName", "middle_name");
    setStr("lastName", "last_name");
    setStr("mandal", "mandal");
    setStr("subgroup", "subgroup");
    setStr("center", "center");
    if (typeof b.wing === "string") patch.wing = b.wing === "iSide" ? "iSide" : "eSide";
    if (typeof b.goshthiGroup === "string") {
      const g = (b.goshthiGroup as string).trim();
      patch.goshthi_group = g;
      patch.track = (b.track === "A" || b.track === "B" ? b.track : groupToTrack(g)) ?? null;
    } else if (b.track === "A" || b.track === "B") {
      patch.track = b.track;
    }
    if (typeof b.isActive === "boolean") patch.is_active = b.isActive;
    if (typeof b.isAdmin === "boolean") patch.is_admin = b.isAdmin;

    if (Object.keys(patch).length === 0) return fail("Nothing to update", 400);

    const db = getDb();
    const { data, error } = await db.from("delegates").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return ok({ delegate: data });
  });
}
