// Build the delegate's personal day from the (admin-adjustable) schedule blocks.
// Shows the shared blocks everyone attends plus the delegate's own specifics resolved to a
// single value (their Asmita Talks room + topic per round by track, their goshthi + moderator,
// their wing's group photo). Other wings'/tracks' variants are removed entirely so it reads
// as "my day," not the master schedule with my parts marked.
import {
  goshthiModerator,
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
  hasMap: boolean; // movement block -> show a link to the floor-plan maps
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
  const items: ScheduleItem[] = [];

  for (const b of blocks) {
    // Drop the other wing's group-photo block (and any other single-wing block that
    // isn't this delegate's) so only the delegate's day remains.
    if ((b.scope === "eSide" || b.scope === "iSide") && b.scope !== delegate.wing) {
      continue;
    }

    const highlights: Highlight[] = [];
    let location = b.location;
    const round = b.category === "asmita_talks" ? roundFromBlockName(b.name) : null;

    // Asmita Talks: resolve to the delegate's single room + topic for their track.
    if (b.category === "asmita_talks" && round && track) {
      const room = roomForTrackRound(track, round);
      if (room) {
        location = `Room ${room}`;
        highlights.push({ label: "Your room", value: `Room ${room}` });
        const topic = topicForRoom(round, room);
        if (topic) highlights.push({ label: "Topic", value: topic });
      }
    }

    // Goshthi: the delegate's group + their moderator.
    if (b.scope === "by_goshthi_group") {
      if (delegate.goshthi_group) {
        highlights.push({ label: "Your group", value: delegate.goshthi_group });
      }
      const mod = goshthiModerator(delegate.goshthi_group);
      if (mod) highlights.push({ label: "Moderator", value: mod });
    }

    items.push({
      id: b.id,
      name: b.name,
      category: b.category,
      scope: b.scope,
      location,
      details: b.details,
      start: hhmm(b.start_time),
      end: hhmm(b.end_time),
      highlights,
      hasMap: b.flow_map_key != null,
      round,
    });
  }

  return items;
}
