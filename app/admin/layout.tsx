import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { IconArrowLeft } from "@/components/ui";
import { fullName } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");
  if (!delegate.is_admin) redirect("/schedule");

  return (
    <div className="min-h-dvh bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/AsmitaDin_Logo_Color.png" alt="Asmita Din" className="h-6 w-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wide bg-brand text-white rounded-full px-2.5 py-1">
              Admin
            </span>
            <span className="text-muted text-sm hidden sm:inline">{fullName(delegate)}</span>
          </div>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand active:opacity-70 tap"
          >
            <IconArrowLeft size={16} /> Delegate view
          </Link>
        </header>
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
