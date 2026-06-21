// One-time webhook setup for the Telegram bot (owner runs this after deploy).
//
//   node --env-file=.env.local scripts/set-webhook.mjs https://your-app.vercel.app
//
// Falls back to NEXT_PUBLIC_APP_URL if no URL arg is given. Sets the webhook (with an
// optional shared secret from TELEGRAM_WEBHOOK_SECRET) and registers /start and /help.

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set.");
  process.exit(1);
}

const base = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Provide the app URL: node scripts/set-webhook.mjs https://your-app.vercel.app");
  process.exit(1);
}

const webhookUrl = `${base}/api/telegram/webhook`;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

async function call(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const setRes = await call("setWebhook", {
  url: webhookUrl,
  allowed_updates: ["message"],
  ...(secret ? { secret_token: secret } : {}),
});
console.log("setWebhook:", setRes);

const cmdRes = await call("setMyCommands", {
  commands: [
    { command: "start", description: "Open KY Asmita Din" },
    { command: "help", description: "How to use the app" },
  ],
});
console.log("setMyCommands:", cmdRes);

const info = await call("getWebhookInfo", {});
console.log("getWebhookInfo:", info);
