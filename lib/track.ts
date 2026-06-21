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
  1: { "214": "Bhagwan Swaminarayan", "212": "Holy Scriptures of the Sampraday" },
  2: { "214": "Bhagwan Swaminarayan", "212": "Holy Scriptures of the Sampraday" },
  3: { "214": "Gunatit Guru Parampara", "212": "Magnificent Mandirs of the Sampraday" },
  4: { "214": "Sadhus & Devotees of the Sampraday", "212": "Magnificent Mandirs of the Sampraday" },
  5: { "214": "Gunatit Guru Parampara", "212": "Sadhus & Devotees of the Sampraday" },
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

// Resolve the flow-map asset key for a schedule block's flow_map_key + the delegate's track.
// Returns the optimized SVG basename in /public/flowmaps, or null for "no map".
export function resolveFlowMapAsset(
  flowMapKey: string | null | undefined,
  track: Track | null,
): string | null {
  if (!flowMapKey) return null;
  switch (flowMapKey) {
    case "program2_to_lunch":
      return "program2_to_lunch";
    case "talks_round_1":
      // Destination room differs by track: A -> 214 (Round 1.svg), B -> 212 (Round 1.5.svg)
      if (track === "A") return "talks_round_1_214";
      if (track === "B") return "talks_round_1_212";
      return "talks_round_1_214";
    case "talks_round_2_4":
      return "talks_round_2_4";
    default:
      return null;
  }
}

// Wing -> css layer suffix used by the flow-map viewer ("e" = blue eSide, "i" = red iSide).
export function wingLayer(wing: Wing | string): "e" | "i" {
  return wing === "iSide" ? "i" : "e";
}

export function wingLabel(wing: Wing | string): string {
  return wing === "iSide" ? "Kishoris / Yuvatis" : "Kishores / Yuvaks";
}

export function wingColor(wing: Wing | string): string {
  return wing === "iSide" ? "#d56062" : "#067bc2";
}
