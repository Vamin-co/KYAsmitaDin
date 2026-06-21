// Minimal Telegram bot webhook — a launcher only (no cron, no notifications).
// Handles /start and /help: replies with a short welcome + a button that opens the Mini App.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function appUrl(): string | null {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.MINIAPP_URL || null;
}

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const url = appUrl();
  const reply_markup = url
    ? { inline_keyboard: [[{ text: "Open Asmita Din", web_app: { url } }]] }
    : undefined;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  // Optional shared-secret check (set via setWebhook secret_token).
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expected) return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const text: string | undefined = msg?.text;
  const chatId: number | undefined = msg?.chat?.id;

  if (chatId && typeof text === "string") {
    if (text.startsWith("/start") || text.startsWith("/help")) {
      await sendMessage(
        chatId,
        "Welcome to Asmita Din. Open the app for your personalized schedule, room maps, the food menu, and trivia. Log in once with your MIS ID and it stays linked to you.",
      );
    }
  }

  // Always 200 so Telegram doesn't retry.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
