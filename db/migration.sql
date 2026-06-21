-- KY Asmita Din — schema. Idempotent (safe to re-run).
-- Access model: the app talks to Postgres ONLY via the service-role key (bypasses RLS).
-- RLS is enabled with NO policies on every table, so the public/anon key is fully denied.
-- The points ledger is append-only, enforced by a trigger (applies even to the service role).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- delegates
create table if not exists delegates (
  id            uuid primary key default gen_random_uuid(),
  mis_id        text not null unique,
  first_name    text not null default '',
  middle_name   text,
  last_name     text not null default '',
  wing          text not null default 'eSide',          -- eSide | iSide
  mandal        text not null default '',
  subgroup      text,
  center        text not null default '',
  goshthi_group text not null default '',
  track         text,                                    -- A | B (derived)
  tshirt_size   text,
  is_admin      boolean not null default false,
  is_active     boolean not null default true,
  telegram_id   bigint unique,
  created_at    timestamptz not null default now()
);
create index if not exists idx_delegates_telegram on delegates(telegram_id);

-- ---------------------------------------------------------------- questions
create table if not exists questions (
  id               uuid primary key default gen_random_uuid(),
  prompt           text not null,
  accepted_answers text[] not null default '{}',
  status           text not null default 'draft',        -- draft | open | closed
  sort_order       int not null default 0,
  created_by       uuid references delegates(id),
  created_at       timestamptz not null default now(),
  opened_at        timestamptz,
  closed_at        timestamptz
);

-- ---------------------------------------------------------------- submissions
create table if not exists submissions (
  id                uuid primary key default gen_random_uuid(),
  question_id       uuid not null references questions(id) on delete cascade,
  delegate_id       uuid not null references delegates(id) on delete cascade,
  attempt_no        int not null,                        -- 1 | 2
  raw_answer        text not null,
  normalized_answer text not null,
  is_correct        boolean not null,
  created_at        timestamptz not null default now(),
  unique (question_id, delegate_id, attempt_no)
);
create index if not exists idx_sub_question on submissions(question_id);
create index if not exists idx_sub_delegate on submissions(delegate_id);

-- ---------------------------------------------------------------- points_ledger (append-only)
create table if not exists points_ledger (
  id                    uuid primary key default gen_random_uuid(),
  delegate_id           uuid not null references delegates(id) on delete cascade,
  delta                 int not null,
  source                text not null,                   -- question_correct | manual_adjustment | correction
  reference_question_id uuid references questions(id) on delete set null,
  note                  text,
  actor                 text not null default 'system',  -- admin delegate id, or 'system'
  created_at            timestamptz not null default now()
);
create index if not exists idx_ledger_delegate on points_ledger(delegate_id);
create index if not exists idx_ledger_refq on points_ledger(reference_question_id);

create or replace function block_ledger_mutation() returns trigger as $$
begin
  raise exception 'points_ledger is append-only: % is not allowed', tg_op;
end;
$$ language plpgsql;

drop trigger if exists trg_ledger_no_update on points_ledger;
create trigger trg_ledger_no_update before update on points_ledger
  for each row execute function block_ledger_mutation();

drop trigger if exists trg_ledger_no_delete on points_ledger;
create trigger trg_ledger_no_delete before delete on points_ledger
  for each row execute function block_ledger_mutation();

-- ---------------------------------------------------------------- schedule_blocks
create table if not exists schedule_blocks (
  id           int primary key,
  name         text not null,
  category     text not null default 'other',
  scope        text not null default 'all',
  location     text not null default '',
  details      text not null default '',
  start_time   time not null,
  end_time     time not null,
  flow_map_key text
);

-- ---------------------------------------------------------------- menu_sections
create table if not exists menu_sections (
  id                  text primary key,
  label               text not null,
  items               text[] not null default '{}',
  reveal_anchor_block int not null,
  manual_state        text,                              -- null | reveal | hide
  sort_order          int not null default 0
);

-- ---------------------------------------------------------------- lock down (RLS, no policies)
alter table delegates       enable row level security;
alter table questions       enable row level security;
alter table submissions     enable row level security;
alter table points_ledger   enable row level security;
alter table schedule_blocks enable row level security;
alter table menu_sections   enable row level security;
