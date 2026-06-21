import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

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
      <div className="space-y-4">
        {PLANS.map((p) => (
          <figure key={p.label} className="bg-card rounded-2xl border border-line overflow-hidden">
            <figcaption className="flex items-center gap-2 px-5 pt-4 pb-3">
              <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-ink">{p.label}</h2>
            </figcaption>
            <div className="bg-paper border-t border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={`Seattle Mandir ${p.label} floor plan`}
                className="block w-full h-auto"
              />
            </div>
          </figure>
        ))}
      </div>
      <p className="text-muted text-xs mt-4 leading-relaxed">
        Use these to find your way between rooms. Asmita Talks rooms (212 and 214) are upstairs.
      </p>
    </>
  );
}
