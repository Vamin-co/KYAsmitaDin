// Seed roster + schedule + menu + admin via the Supabase service-role key (PostgREST).
// Use this when the schema was applied manually in the SQL editor (no DB connection string).
//
//   node --env-file=.env.local scripts/seed-rest.mjs
//
// Idempotent: upserts roster-derived fields and preserves runtime state (is_admin,
// is_active, telegram_id) on re-run.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV = "[SEA] KY Asmita Din - Overview Sheet - Copy of Final Registration.csv";
const ADMIN_MIS = "586086";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

function splitCsvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function normalizeGroup(raw) {
  return (raw || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
const TRACK_A = ["ghanshyam", "nilkanth", "chidakash", "brahma"];
const TRACK_B = ["sahajanand", "parabrahma", "gunatit", "pragat"];
function groupToTrack(raw) {
  const g = normalizeGroup(raw);
  if (TRACK_A.includes(g)) return "A";
  if (TRACK_B.includes(g)) return "B";
  return null;
}

function parseRoster() {
  const text = readFileSync(join(ROOT, CSV), "utf8");
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => l.startsWith("First Name"));
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.replace(/,/g, "").trim() === "") continue;
    const c = splitCsvLine(line);
    const mis = (c[10] || "").trim();
    if (!mis) continue;
    rows.push({
      mis_id: mis,
      first_name: (c[0] || "").trim(),
      middle_name: (c[1] || "").trim() || null,
      last_name: (c[2] || "").trim(),
      wing: (c[3] || "").trim(),
      mandal: (c[4] || "").trim(),
      subgroup: (c[5] || "").trim() || null,
      center: (c[6] || "").trim(),
      goshthi_group: (c[7] || "").trim(),
      track: groupToTrack(c[7]),
      tshirt_size: (c[9] || "").trim() || null,
    });
  }
  return rows;
}

async function main() {
  const roster = parseRoster();
  const schedule = JSON.parse(readFileSync(join(ROOT, "ky_schedule.json"), "utf8"));
  const menu = JSON.parse(readFileSync(join(ROOT, "menu.json"), "utf8"));

  // delegates (roster-derived columns only -> preserves is_admin/is_active/telegram_id on re-run)
  let r = await db.from("delegates").upsert(roster, { onConflict: "mis_id" });
  if (r.error) throw r.error;

  // admin
  r = await db.from("delegates").update({ is_admin: true }).eq("mis_id", ADMIN_MIS);
  if (r.error) throw r.error;

  // schedule
  const blocks = schedule.schedule.map((b) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    scope: b.scope,
    location: b.location || "",
    details: b.details || "",
    start_time: b.start,
    end_time: b.end,
    flow_map_key: b.flow_map_key,
  }));
  r = await db.from("schedule_blocks").upsert(blocks, { onConflict: "id" });
  if (r.error) throw r.error;

  // menu (items come straight from menu.json; dessert displays "Hellenika" per the
  // group's decision — see CLAUDE.md / menu.json note)
  const sections = menu.sections.map((s, i) => ({
    id: s.id,
    label: s.label,
    items: s.items,
    reveal_anchor_block: s.reveal_anchor_block,
    manual_state: null,
    sort_order: i,
  }));
  r = await db.from("menu_sections").upsert(sections, { onConflict: "id" });
  if (r.error) throw r.error;

  const [d, a, b, m] = await Promise.all([
    db.from("delegates").select("id", { count: "exact", head: true }),
    db.from("delegates").select("id", { count: "exact", head: true }).eq("is_admin", true),
    db.from("schedule_blocks").select("id", { count: "exact", head: true }),
    db.from("menu_sections").select("id", { count: "exact", head: true }),
  ]);
  console.log("seed complete:", {
    delegates: d.count,
    admins: a.count,
    blocks: b.count,
    menu: m.count,
  });
}

main().catch((e) => {
  console.error("seed failed:", e.message || e);
  process.exit(1);
});
