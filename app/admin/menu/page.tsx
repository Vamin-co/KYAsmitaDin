import { getMenuSections, getScheduleBlocks } from "@/lib/queries";
import { MenuAdmin, type MenuLite } from "@/components/admin/MenuAdmin";

export const dynamic = "force-dynamic";

function hhmm(t: string | undefined): string | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

export default async function AdminMenuPage() {
  const [sections, blocks] = await Promise.all([getMenuSections(), getScheduleBlocks()]);
  const startById = new Map(blocks.map((b) => [b.id, b.start_time]));
  const lite: MenuLite[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
    manualState: s.manual_state,
    anchorStart: hhmm(startById.get(s.reveal_anchor_block)),
    items: s.items,
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-ink mb-4">Menu control</h1>
      <MenuAdmin sections={lite} />
    </div>
  );
}
