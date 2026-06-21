"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconPin } from "./ui";

// Fetches the optimized (static, CDN-cached) SVG, shows only the delegate's wing layer,
// and animates the route draw-on. Pure CSS/SVG, respects prefers-reduced-motion.
export function FlowMapViewer({
  asset,
  wing,
  title,
  subtitle,
  destination,
  backHref = "/schedule",
}: {
  asset: string;
  wing: "e" | "i";
  title: string;
  subtitle?: string;
  destination?: string;
  backHref?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    (async () => {
      try {
        const res = await fetch(`/flowmaps/${asset}.svg`, { cache: "force-cache" });
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        if (cancelled || !host) return;

        host.innerHTML = text;
        host.classList.add("flow-wrap", `wing-show-${wing}`);

        const reduce =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        const arrows = Array.from(
          host.querySelectorAll<SVGGeometryElement>(`[data-flow-arrow][data-wing="${wing}"]`),
        );
        const markers = Array.from(
          host.querySelectorAll<SVGGraphicsElement>(`[data-flow-marker][data-wing="${wing}"]`),
        );

        if (reduce) {
          setState("ready");
          return;
        }

        // Initialize hidden, synchronously, to avoid a flash of the full route.
        let totalDelay = 0;
        const lengths: number[] = [];
        for (const a of arrows) {
          let len = 300;
          try {
            len = a.getTotalLength() || 300;
          } catch {
            /* line elements in some engines */
          }
          lengths.push(len);
          a.style.strokeDasharray = `${len}`;
          a.style.strokeDashoffset = `${len}`;
        }
        for (const mk of markers) mk.style.opacity = "0";

        // Animate on the next frame.
        requestAnimationFrame(() => {
          if (cancelled) return;
          arrows.forEach((a, i) => {
            const len = lengths[i];
            const dur = Math.min(1100, Math.max(450, len * 1.6));
            a.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(0.16,1,0.3,1) ${totalDelay}ms`;
            a.style.strokeDashoffset = "0";
            totalDelay += Math.min(260, dur * 0.5);
          });
          const markerStart = totalDelay + 120;
          markers.forEach((mk, i) => {
            mk.style.animation = `marker-in 320ms cubic-bezier(0.16,1,0.3,1) ${
              markerStart + i * 60
            }ms both, flow-pulse 2.4s ease-in-out ${markerStart + 400 + i * 60}ms infinite`;
          });
          setState("ready");
        });
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [asset, wing]);

  const wingColor = wing === "i" ? "#d56062" : "#067bc2";
  const wingName = wing === "i" ? "Kishoris / Yuvatis" : "Kishores / Yuvaks";

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Link
          href={backHref}
          aria-label="Back to schedule"
          className="size-9 grid place-items-center rounded-full border border-line bg-card text-ink active:scale-95 transition-transform tap shrink-0"
        >
          <IconArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-ink leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-muted text-xs">{subtitle}</p>}
        </div>
      </div>

      {/* custom single-wing legend (the baked-in legend is masked out) */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink bg-card border border-line rounded-full pl-2 pr-3 py-1">
          <span className="size-3.5 rounded-[4px]" style={{ background: wingColor }} aria-hidden="true" />
          {wingName}
        </span>
        {destination && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            <IconPin size={15} /> {destination}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-card overflow-hidden relative">
        {state === "loading" && (
          <div className="aspect-[16/9] w-full bg-paper animate-pulse grid place-items-center">
            <span className="text-muted text-sm">Loading route…</span>
          </div>
        )}
        {state === "error" && (
          <div className="aspect-[16/9] w-full grid place-items-center text-center px-6">
            <p className="text-muted text-sm">Couldn&apos;t load the route map. Try again.</p>
          </div>
        )}
        <div ref={hostRef} className={state === "ready" ? "block" : "hidden"} />
      </div>

      <p className="text-muted text-xs mt-3 leading-relaxed">
        Your wing&apos;s path is highlighted. Follow the arrow from where you are to your room.
      </p>
    </div>
  );
}
