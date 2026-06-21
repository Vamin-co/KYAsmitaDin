// MIS ID login. Only a recognized, active MIS ID can log in. If a valid Telegram initData
// is present, bind this Telegram id to the delegate (last-login-wins: the binding moves off
// any other delegate that held it).
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { validateInitData } from "@/lib/telegram";
import { setSessionCookie } from "@/lib/session";
import { ok, fail, guard } from "@/lib/http";
import type { Delegate } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = (await req.json().catch(() => ({}))) as { misId?: string; initData?: string };
    const misId = (body.misId ?? "").trim();
    if (!misId) return fail("Enter your MIS ID", 400);

    const db = getDb();
    const { data } = await db
      .from("delegates")
      .select("*")
      .eq("mis_id", misId)
      .maybeSingle();

    if (!data || !(data as Delegate).is_active) {
      return fail("MIS ID not recognized", 401);
    }
    const d = data as Delegate;

    // Optional Telegram binding (last-login-wins).
    if (body.initData) {
      const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
      const result = validateInitData(body.initData, token);
      if (result.valid && result.user) {
        const tgId = result.user.id;
        // Move the binding off any other delegate first (unique constraint).
        await db.from("delegates").update({ telegram_id: null }).eq("telegram_id", tgId).neq("id", d.id);
        await db.from("delegates").update({ telegram_id: tgId }).eq("id", d.id);
      }
    }

    await setSessionCookie({ delegateId: d.id, misId: d.mis_id });
    return ok({
      delegate: { id: d.id, misId: d.mis_id, firstName: d.first_name, isAdmin: d.is_admin },
    });
  });
}
