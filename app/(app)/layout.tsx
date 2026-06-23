import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  return (
    <div className="min-h-dvh bg-paper">
      <AppHeader />
      <div className="max-w-md mx-auto px-4 pb-28 pt-4">{children}</div>
      <BottomNav />
    </div>
  );
}
