import { getSessionDelegate } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getScheduleBlocks } from "@/lib/queries";
import { buildPersonalSchedule } from "@/lib/schedule";
import { PageHeader } from "@/components/PageHeader";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { wingLabel } from "@/lib/track";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  const blocks = await getScheduleBlocks();
  const items = buildPersonalSchedule(delegate, blocks);

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={`${wingLabel(delegate.wing)} · Track ${delegate.track ?? "—"}`}
      />
      {items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-line p-8 text-center text-muted">
          The schedule is being finalized.
        </div>
      ) : (
        <ScheduleTimeline items={items} />
      )}
    </>
  );
}
