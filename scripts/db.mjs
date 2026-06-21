// Migration + seed runner. Connects to Postgres via SUPABASE_DB_URL (the only thing the
// provided API keys cannot do is DDL, so this needs the DB connection string).
//
//   node --env-file=.env.local scripts/db.mjs migrate   # apply db/migration.sql
//   node --env-file=.env.local scripts/db.mjs seed       # roster + schedule + menu + admin
//   node --env-file=.env.local scripts/db.mjs all        # both
//
// Re-running is safe: migration is idempotent; seed upserts roster-derived fields only and
// never clobbers runtime state (is_admin, is_active, telegram_id).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const CSV = "[SEA] KY Asmita Din - Overview Sheet - Copy of Final Registration.csv";
const ADMIN_MIS = "586086";

function connString() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error(
      "\nSUPABASE_DB_URL is not set. Add the Postgres connection string to .env.local, e.g.\n" +
        "  SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR-REF.supabase.co:5432/postgres\n" +
        "(Settings -> Database -> Connection string -> URI, or the Session pooler URI.)\n",
    );
    process.exit(1);
  }
  return url;
}

async function withClient(fn) {
  const client = new pg.Client({
    connectionString: connString(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

// --- minimal CSV line splitter (handles quotes) ---
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

// --- track mapping (kept in sync with lib/track.ts) ---
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
  if (headerIdx < 0) throw new Error("roster header row not found");
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim() || line.replace(/,/g, "").trim() === "") continue;
    const c = splitCsvLine(line);
    const mis = (c[10] || "").trim();
    if (!mis) continue;
    rows.push({
      first_name: (c[0] || "").trim(),
      middle_name: (c[1] || "").trim() || null,
      last_name: (c[2] || "").trim(),
      wing: (c[3] || "").trim(),
      mandal: (c[4] || "").trim(),
      subgroup: (c[5] || "").trim() || null,
      center: (c[6] || "").trim(),
      goshthi_group: (c[7] || "").trim(),
      tshirt_size: (c[9] || "").trim() || null,
      mis_id: mis,
      track: groupToTrack(c[7]),
    });
  }
  return rows;
}

async function migrate() {
  const sql = readFileSync(join(ROOT, "db", "migration.sql"), "utf8");
  await withClient(async (c) => {
    await c.query(sql);
  });
  console.log("migration applied.");
}

async function seed() {
  const roster = parseRoster();
  const schedule = JSON.parse(readFileSync(join(ROOT, "ky_schedule.json"), "utf8"));
  const menu = JSON.parse(readFileSync(join(ROOT, "menu.json"), "utf8"));

  await withClient(async (c) => {
    await c.query("begin");
    try {
      // delegates — upsert roster-derived fields, preserve runtime state on conflict.
      for (const d of roster) {
        await c.query(
          `insert into delegates
             (mis_id, first_name, middle_name, last_name, wing, mandal, subgroup, center, goshthi_group, track, tshirt_size)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           on conflict (mis_id) do update set
             first_name=excluded.first_name, middle_name=excluded.middle_name,
             last_name=excluded.last_name, wing=excluded.wing, mandal=excluded.mandal,
             subgroup=excluded.subgroup, center=excluded.center,
             goshthi_group=excluded.goshthi_group, track=excluded.track,
             tshirt_size=excluded.tshirt_size`,
          [d.mis_id, d.first_name, d.middle_name, d.last_name, d.wing, d.mandal,
           d.subgroup, d.center, d.goshthi_group, d.track, d.tshirt_size],
        );
      }

      // admin seed (idempotent)
      await c.query(`update delegates set is_admin = true where mis_id = $1`, [ADMIN_MIS]);

      // schedule_blocks
      for (const b of schedule.schedule) {
        await c.query(
          `insert into schedule_blocks (id, name, category, scope, location, details, start_time, end_time, flow_map_key)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           on conflict (id) do update set
             name=excluded.name, category=excluded.category, scope=excluded.scope,
             location=excluded.location, details=excluded.details,
             flow_map_key=excluded.flow_map_key`,
          [b.id, b.name, b.category, b.scope, b.location || "", b.details || "",
           b.start, b.end, b.flow_map_key],
        );
        // Note: start_time/end_time are admin-adjustable at runtime, so only set them when
        // the row is first created (above ON CONFLICT does not touch times on re-seed).
      }

      // menu_sections
      let order = 0;
      for (const s of menu.sections) {
        await c.query(
          `insert into menu_sections (id, label, items, reveal_anchor_block, manual_state, sort_order)
           values ($1,$2,$3,$4,null,$5)
           on conflict (id) do update set
             label=excluded.label, items=excluded.items,
             reveal_anchor_block=excluded.reveal_anchor_block, sort_order=excluded.sort_order`,
          [s.id, s.label, s.items, s.reveal_anchor_block, order++],
        );
      }

      await c.query("commit");
    } catch (e) {
      await c.query("rollback");
      throw e;
    }

    const counts = await c.query(
      `select
         (select count(*) from delegates) as delegates,
         (select count(*) from delegates where is_admin) as admins,
         (select count(*) from schedule_blocks) as blocks,
         (select count(*) from menu_sections) as menu`,
    );
    console.log("seed complete:", counts.rows[0]);
  });
}

const cmd = process.argv[2];
if (cmd === "migrate") await migrate();
else if (cmd === "seed") await seed();
else if (cmd === "all") { await migrate(); await seed(); }
else { console.error("usage: db.mjs <migrate|seed|all>"); process.exit(1); }
