// Telegram Mini App initData validation (server-side, against the bot token).
// Never trust client-sent identity — every authenticated request re-validates.
import "server-only";
import crypto from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface InitDataResult {
  valid: boolean;
  user?: TelegramUser;
  authDate?: number;
  reason?: string;
}

// Validates the signed initData blob. Returns the parsed user when valid.
// Algorithm per Telegram docs:
//   secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)
//   computed   = HMAC_SHA256(key=secret_key, data=data_check_string)  // hex
//   compare computed === hash
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24, // tolerate a day; the event is single-day
): InitDataResult {
  if (!initData || !botToken) return { valid: false, reason: "missing initData or token" };

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { valid: false, reason: "unparseable initData" };
  }

  const hash = params.get("hash");
  if (!hash) return { valid: false, reason: "no hash" };

  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "bad signature" };
  }

  const authDate = Number(params.get("auth_date") ?? 0);
  if (maxAgeSeconds > 0 && authDate > 0) {
    const ageSec = Math.floor(Date.now() / 1000) - authDate;
    if (ageSec > maxAgeSeconds) return { valid: false, reason: "initData expired" };
  }

  let user: TelegramUser | undefined;
  const userRaw = params.get("user");
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as TelegramUser;
    } catch {
      return { valid: false, reason: "bad user json" };
    }
  }

  return { valid: true, user, authDate };
}
