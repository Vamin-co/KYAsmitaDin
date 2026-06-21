// Asmita Talks track routing + flow-map binding (fixed by CLAUDE.md / ky_schedule.json).
// Track is determined by goshthi group; rooms rotate per round; flow maps bind by the
// ky_schedule.json `flow_maps` table, never by filename.

export type Track = "A" | "B";
export type Wing = "eSide" | "iSide";

// Normalize a goshthi group name: strip diacritics, lowercase, trim.
// Roster uses diacritics (Ghanshyãm, Sahajãnand, Chidãkãsh, Gunãtit); tracks use ASCII.
export function normalizeGroup(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining diacritics
    .toLowerCase()
    .trim();
}

const TRACK_A_GROUPS = ["ghanshyam", "nilkanth", "chidakash", "brahma"];
const TRACK_B_GROUPS = ["sahajanand", "parabrahma", "gunatit", "pragat"];

// Track A: rooms 214,212,214,212,212 across rounds 1-5 (starts on Bhagwan Swaminarayan/214)
// Track B: rooms 212,214,212,214,214 (starts on Holy Scriptures/212)
const TRACK_A_ROOMS = ["214", "212", "214", "212", "212"];
const TRACK_B_ROOMS = ["212", "214", "212", "214", "214"];

export function groupToTrack(rawGroup: string | null | undefined): Track | null {
  const g = normalizeGroup(rawGroup);
  if (TRACK_A_GROUPS.includes(g)) return "A";
  if (TRACK_B_GROUPS.includes(g)) return "B";
  return null;
}

// Room for a given track and round (1-indexed, rounds 1..5). Returns null if out of range.
export function roomForTrackRound(track: Track, round: number): string | null {
  const rooms = track === "A" ? TRACK_A_ROOMS : TRACK_B_ROOMS;
  if (round < 1 || round > rooms.length) return null;
  return rooms[round - 1];
}

// The presentation topic per room per round, from ky_schedule.json asmita_talks.slots.
// room_214 / room_212 topic by round.
const ROUND_TOPICS: Record<number, { "214": string; "212": string }> = {
  1: { "214": "Bhagwan Swaminarayan", "212": "The Holy Scriptures of the Sampraday" },
  2: { "214": "Bhagwan Swaminarayan", "212": "The Holy Scriptures of the Sampraday" },
  3: { "214": "The Gunatit Guru Parampara", "212": "The Magnificent Mandirs of the Sampraday" },
  4: { "214": "The Sadhus & Devotees of the Sampraday", "212": "The Magnificent Mandirs of the Sampraday" },
  5: { "214": "The Gunatit Guru Parampara", "212": "The Sadhus & Devotees of the Sampraday" },
};

export function topicForRoom(round: number, room: string): string | null {
  const t = ROUND_TOPICS[round];
  if (!t) return null;
  if (room === "214") return t["214"];
  if (room === "212") return t["212"];
  return null;
}

// Parse the round number out of a schedule block name like "Asmita Talks - Round 3".
export function roundFromBlockName(name: string): number | null {
  const m = name.match(/round\s+(\d)/i);
  return m ? Number(m[1]) : null;
}

export function wingLabel(wing: Wing | string): string {
  return wing === "iSide" ? "Kishoris / Yuvatis" : "Kishores / Yuvaks";
}

// Goshthi moderator per goshthi group (keyed on the normalized group name, so the roster's
// diacritic forms map too). Hardcoded per the event lead.
const GOSHTHI_MODERATORS: Record<string, string> = {
  ghanshyam: "Akshaybhai Patel",
  nilkanth: "Ankitbhai Patel",
  sahajanand: "Parjanyabhai Brahmachari",
  parabrahma: "Tarunbhai Patel",
  chidakash: "Sneha Parikh",
  brahma: "Nipa Patel",
  gunatit: "Payal P Patel",
  pragat: "Janki Mistry",
};

export function goshthiModerator(rawGroup: string | null | undefined): string | null {
  return GOSHTHI_MODERATORS[normalizeGroup(rawGroup)] ?? null;
}
