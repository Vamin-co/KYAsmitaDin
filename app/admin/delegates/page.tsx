import Link from "next/link";
import { getAllDelegates } from "@/lib/queries";
import { AddDelegate } from "@/components/admin/AddDelegate";
import { fullName } from "@/lib/types";
import { IconChevronRight, IconShield } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DelegatesPage() {
  const delegates = await getAllDelegates(true);
  const active = delegates.filter((d) => d.is_active).length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Delegates</h1>
        <span className="text-muted text-sm">
          {active} active · {delegates.length} total
        </span>
      </div>
      <AddDelegate />
      <div className="bg-card rounded-2xl border border-line overflow-hidden">
        {delegates.map((d) => (
          <Link
            key={d.id}
            href={`/admin/delegates/${d.id}`}
            className={`flex items-center gap-3 px-4 py-3 border-b border-line last:border-0 tap hover:bg-paper ${
              !d.is_active ? "opacity-50" : ""
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-medium text-ink truncate">{fullName(d)}</span>
                {d.is_admin && <IconShield size={14} className="text-brand shrink-0" />}
              </span>
              <span className="block text-muted text-xs tabular-nums">
                MIS {d.mis_id} · {d.goshthi_group} · Track {d.track ?? "—"}
                {!d.is_active && " · removed"}
              </span>
            </span>
            <IconChevronRight size={16} className="text-muted shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
