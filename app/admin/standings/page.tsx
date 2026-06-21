import { getStandings } from "@/lib/queries";
import { StandingsTable, type StandingLite } from "@/components/admin/StandingsTable";
import { fullName } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const rows = await getStandings();
  const lite: StandingLite[] = rows.map((r) => ({
    delegateId: r.delegate.id,
    name: fullName(r.delegate),
    misId: r.delegate.mis_id,
    score: r.score,
    current: r.current,
    longest: r.longest,
    isActive: r.delegate.is_active,
  }));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Standings</h1>
        <span className="text-muted text-sm">Admin only</span>
      </div>
      <StandingsTable rows={lite} />
    </div>
  );
}
