// Shared row types mirroring the Postgres schema.

export interface Delegate {
  id: string;
  mis_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  wing: "eSide" | "iSide";
  mandal: string;
  subgroup: string | null;
  center: string;
  goshthi_group: string;
  track: "A" | "B" | null;
  tshirt_size: string | null;
  is_admin: boolean;
  is_active: boolean;
  telegram_id: number | null;
  created_at: string;
}

export interface Question {
  id: string;
  prompt: string;
  accepted_answers: string[];
  status: "draft" | "open" | "closed";
  sort_order: number;
  created_by: string | null;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  // Multiple-choice support (additive; defaults make existing text questions unchanged).
  type: "text" | "multiple_choice";
  options: string[] | null;
  correct_option: number | null;
}

export interface Submission {
  id: string;
  question_id: string;
  delegate_id: string;
  attempt_no: number;
  raw_answer: string;
  normalized_answer: string;
  is_correct: boolean;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  delegate_id: string;
  delta: number;
  source: "question_correct" | "manual_adjustment" | "correction";
  reference_question_id: string | null;
  note: string | null;
  actor: string;
  created_at: string;
}

export interface ScheduleBlock {
  id: number;
  name: string;
  category: string;
  scope: string;
  location: string;
  details: string;
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  flow_map_key: string | null;
}

export interface MenuSection {
  id: string;
  label: string;
  items: string[];
  reveal_anchor_block: number;
  manual_state: "reveal" | "hide" | null;
}

export function fullName(d: Pick<Delegate, "first_name" | "middle_name" | "last_name">): string {
  const mid = d.middle_name && d.middle_name !== "--" ? ` ${d.middle_name}` : "";
  return `${d.first_name}${mid} ${d.last_name}`.trim();
}
