// Auto-login via Telegram binding. Validates initData server-side; if the Telegram id is
// already bound to a delegate, logs them in. Otherwise asks the client for a MIS ID.
import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { validateInitData } from "@/lib/telegram";
import { setSessionCookie } from "@/lib/session";
import { ok, fail, guard } from "@/lib/http";
import type { Delegate } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return guard(async () => {
    const { initData } = (await req.json().catch(() => ({}))) as { initData?: string };
    const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
    const result = validateInitData(initData ?? "", token);
    if (!result.valid || !result.user) {
      return ok({ authenticated: false, reason: result.reason ?? "invalid" });
    }

    const db = getDb();
    const { data } = await db
      .from("delegates")
      .select("*")
      .eq("telegram_id", result.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) {
      return ok({ authenticated: false, needsMisId: true, tgFirstName: result.user.first_name ?? null });
    }

    const d = data as Delegate;
    await setSessionCookie({ delegateId: d.id, misId: d.mis_id });
    return ok({
      authenticated: true,
      delegate: { id: d.id, misId: d.mis_id, firstName: d.first_name, isAdmin: d.is_admin },
    });
  });
}
