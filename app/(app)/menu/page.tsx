import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";
import { getMenuSections, getScheduleBlocks } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { MenuList, type MenuSectionVM } from "@/components/MenuList";

export const dynamic = "force-dynamic";

function hhmm(t: string | undefined): string | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}

export default async function MenuPage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  const [sections, blocks] = await Promise.all([getMenuSections(), getScheduleBlocks()]);
  const startById = new Map(blocks.map((b) => [b.id, b.start_time]));

  const vms: MenuSectionVM[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
    items: s.items,
    manualState: s.manual_state,
    anchorStart: hhmm(startById.get(s.reveal_anchor_block)),
  }));

  return (
    <>
      <PageHeader title="Menu" subtitle="Revealed through the day" />
      <MenuList sections={vms} />
    </>
  );
}
