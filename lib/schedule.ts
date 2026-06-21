// Build the personalized schedule view-model for a delegate from the (admin-adjustable)
// schedule blocks. Shared, pure logic (no server-only deps) so it is easy to reason about.
import {
  resolveFlowMapAsset,
  roundFromBlockName,
  roomForTrackRound,
  topicForRoom,
  type Track,
} from "./track";
import type { Delegate, ScheduleBlock } from "./types";

export interface Highlight {
  label: string;
  value: string;
}

export interface ScheduleItem {
  id: number;
  name: string;
  category: string;
  scope: string;
  location: string;
  details: string;
  start: string; // HH:MM
  end: string;
  highlights: Highlight[];
  flowAsset: string | null; // resolved optimized-SVG basename, or null
  otherSideOnly: boolean; // a group-photo block for the opposite wing (show dimmed)
  round: number | null;
}

function hhmm(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : t;
}

export function buildPersonalSchedule(
  delegate: Pick<Delegate, "wing" | "track" | "mandal" | "goshthi_group">,
  blocks: ScheduleBlock[],
): ScheduleItem[] {
  const track = (delegate.track as Track | null) ?? null;

  return blocks.map((b) => {
    const highlights: Highlight[] = [];
    let otherSideOnly = false;
    const round = b.category === "asmita_talks" ? roundFromBlockName(b.name) : null;

    if (b.category === "asmita_talks" && round && track) {
      const room = roomForTrackRound(track, round);
      if (room) {
        highlights.push({ label: "Your room", value: `Room ${room}` });
        const topic = topicForRoom(round, room);
        if (topic) highlights.push({ label: "Topic", value: topic });
      }
    }

    if (b.scope === "by_mandal" && delegate.mandal) {
      highlights.push({ label: "Your mandal", value: delegate.mandal });
    }

    if (b.scope === "by_goshthi_group" && delegate.goshthi_group) {
      highlights.push({ label: "Your group", value: delegate.goshthi_group });
    }

    if (b.scope === "eSide" || b.scope === "iSide") {
      if (b.scope === delegate.wing) {
        highlights.push({ label: "Your group photo", value: b.location || "Nij Mandir" });
      } else {
        otherSideOnly = true;
      }
    }

    const flowAsset = resolveFlowMapAsset(b.flow_map_key, track);

    return {
      id: b.id,
      name: b.name,
      category: b.category,
      scope: b.scope,
      location: b.location,
      details: b.details,
      start: hhmm(b.start_time),
      end: hhmm(b.end_time),
      highlights,
      flowAsset,
      otherSideOnly,
      round,
    };
  });
}
