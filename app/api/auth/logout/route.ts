// Logout / switch user — clears the session cookie. The Telegram binding is left intact
// (switching to a different MIS ID on next login rebinds; last-login-wins).
import { clearSessionCookie } from "@/lib/session";
import { ok, guard } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  return guard(async () => {
    await clearSessionCookie();
    return ok({});
  });
}
