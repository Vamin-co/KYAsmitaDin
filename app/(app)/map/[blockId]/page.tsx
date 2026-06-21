import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionDelegate } from "@/lib/auth";
import { getScheduleBlocks } from "@/lib/queries";
import {
  resolveFlowMapAsset,
  roomForTrackRound,
  roundFromBlockName,
  wingLayer,
  type Track,
} from "@/lib/track";
import { formatTime } from "@/lib/time";
import { FlowMapViewer } from "@/components/FlowMapViewer";
import { IconArrowLeft } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MapPage({ params }: { params: Promise<{ blockId: string }> }) {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  const { blockId } = await params;
  const blocks = await getScheduleBlocks();
  const block = blocks.find((b) => String(b.id) === blockId);
  const track = (delegate.track as Track | null) ?? null;
  const asset = block ? resolveFlowMapAsset(block.flow_map_key, track) : null;

  if (!block || !asset) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/schedule"
            aria-label="Back to schedule"
            className="size-9 grid place-items-center rounded-full border border-line bg-card text-ink tap"
          >
            <IconArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-ink">Route</h1>
        </div>
        <div className="bg-card rounded-2xl border border-line p-8 text-center text-muted">
          No route map for this block.
        </div>
      </div>
    );
  }

  const round = block.category === "asmita_talks" ? roundFromBlockName(block.name) : null;
  let destination: string | undefined;
  if (round && track) {
    const room = roomForTrackRound(track, round);
    if (room) destination = `Room ${room}`;
  } else if (block.flow_map_key === "program2_to_lunch") {
    destination = "Dining Hall";
  }

  const subtitle = `${formatTime(block.start_time)} – ${formatTime(block.end_time)}`;

  return (
    <FlowMapViewer
      asset={asset}
      wing={wingLayer(delegate.wing)}
      title={block.name}
      subtitle={subtitle}
      destination={destination}
    />
  );
}
