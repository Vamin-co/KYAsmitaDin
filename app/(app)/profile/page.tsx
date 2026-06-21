import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";
import { getDelegateStats } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { ProfileActions } from "@/components/ProfileActions";
import { IconShield, IconChevronRight } from "@/components/ui";
import { fullName } from "@/lib/types";
import { wingLabel } from "@/lib/track";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");
  const stats = await getDelegateStats(delegate.id);

  const fields: { label: string; value: string }[] = [
    { label: "Group", value: delegate.goshthi_group },
    { label: "Mandal", value: delegate.mandal },
    { label: "Center", value: delegate.center },
    { label: "Wing", value: wingLabel(delegate.wing) },
    { label: "Track", value: delegate.track ? `Track ${delegate.track}` : "—" },
  ];

  return (
    <>
      <PageHeader title="Profile" />

      <div className="bg-card rounded-2xl border border-line overflow-hidden mb-4 animate-rise">
        <div className="nishan-bar" aria-hidden="true" />
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">{fullName(delegate)}</h2>
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide bg-paper border border-line rounded-full px-2.5 py-1 text-muted tabular-nums">
              MIS {delegate.mis_id}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-muted text-[11px] font-semibold uppercase tracking-wide">
                  {f.label}
                </dt>
                <dd className="text-ink font-medium mt-0.5">{f.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mb-4">
        <StatsCard score={stats.score} current={stats.streak.current} longest={stats.streak.longest} />
      </div>

      {delegate.is_admin && (
        <Link
          href="/admin"
          className="mb-4 flex items-center justify-between gap-3 bg-card rounded-2xl border border-line px-5 py-4 active:scale-[0.99] transition-transform tap"
        >
          <span className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-brand/10 text-brand grid place-items-center">
              <IconShield size={19} />
            </span>
            <span>
              <span className="block font-semibold text-ink">Admin view</span>
              <span className="block text-muted text-xs">Run trivia, points, schedule & more</span>
            </span>
          </span>
          <IconChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <ProfileActions />

      <p className="text-center text-muted text-xs mt-6">Kishore-Kishori · Yuvak-Yuvati Asmita Din · 2026</p>
    </>
  );
}
