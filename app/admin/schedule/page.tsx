import { getScheduleBlocks } from "@/lib/queries";
import { ScheduleAdmin, type BlockLite } from "@/components/admin/ScheduleAdmin";

export const dynamic = "force-dynamic";

function hhmm(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : t;
}

export default async function AdminSchedulePage() {
  const blocks = await getScheduleBlocks();
  const lite: BlockLite[] = blocks.map((b) => ({
    id: b.id,
    name: b.name,
    start: hhmm(b.start_time),
    end: hhmm(b.end_time),
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-ink mb-4">Schedule control</h1>
      <ScheduleAdmin blocks={lite} />
    </div>
  );
}
