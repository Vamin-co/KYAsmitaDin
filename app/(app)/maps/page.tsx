import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { MapsView } from "@/components/MapsView";

export const dynamic = "force-dynamic";

const PLANS = [
  { src: "/maps/downstairs.png", label: "Downstairs" },
  { src: "/maps/upstairs.png", label: "Upstairs" },
];

export default async function MapsPage() {
  const delegate = await getSessionDelegate();
  if (!delegate) redirect("/login");

  return (
    <>
      <PageHeader title="Maps" subtitle="Seattle Mandir floor plans" />
      <MapsView plans={PLANS} />
    </>
  );
}
