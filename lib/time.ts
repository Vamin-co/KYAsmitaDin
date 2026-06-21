// Time helpers anchored to the event timezone (America/Los_Angeles).
// Used for menu reveals (which cascade off admin-adjustable block start times) and for
// highlighting the current schedule block.

export const EVENT_TZ = "America/Los_Angeles";

// "HH:MM" or "HH:MM:SS" -> minutes since midnight. Returns null if unparseable.
export function timeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// "HH:MM[:SS]" -> "9:00 AM" display.
export function formatTime(t: string | null | undefined): string {
  const mins = timeToMinutes(t);
  if (mins === null) return "";
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Current minutes-since-midnight in the event timezone.
export function nowMinutesInEventTz(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // Intl can render "24" for midnight in some runtimes; normalize.
  return (hh % 24) * 60 + mm;
}

// Current date (YYYY-MM-DD) in the event timezone.
export function todayInEventTz(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}
