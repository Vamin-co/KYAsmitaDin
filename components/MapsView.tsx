"use client";

import { useEffect, useRef, useState } from "react";
import { IconX, IconPlus, IconMinus } from "./ui";

interface Plan {
  src: string;
  label: string;
}

const MIN = 1;
const MAX = 6;

// Maps grid + a self-contained full-screen zoom/pan viewer. No dependencies: pinch-to-zoom
// and drag-to-pan via Pointer Events, double-tap to toggle, +/- buttons for desktop.
export function MapsView({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-4">
        {plans.map((p, i) => (
          <figure key={p.label} className="bg-card rounded-2xl border border-line overflow-hidden">
            <figcaption className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-ink">{p.label}</h2>
              </div>
              <span className="text-muted text-xs font-medium">Tap to zoom</span>
            </figcaption>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open ${p.label} floor plan full screen`}
              className="block w-full bg-paper border-t border-line tap cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={`Seattle Mandir ${p.label} floor plan`}
                className="block w-full h-auto"
              />
            </button>
          </figure>
        ))}
      </div>

      <p className="text-muted text-xs mt-4 leading-relaxed">
        Use these to find your way between rooms. Asmita Talks rooms (212 and 214) are upstairs.
        Tap a plan to open it full screen, then pinch or double-tap to zoom.
      </p>

      {open !== null && <Lightbox plan={plans[open]} onClose={() => setOpen(null)} />}
    </>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function Lightbox({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const scale = useRef(1);
  const tx = useRef(0);
  const ty = useRef(0);
  const [zoomed, setZoomed] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDist = useRef<number | null>(null);
  const lastMid = useRef<{ x: number; y: number } | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  function apply() {
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(${tx.current}px, ${ty.current}px) scale(${scale.current})`;
    }
  }

  function clampPan() {
    const c = containerRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const maxX = Math.max(0, (img.clientWidth * scale.current - c.clientWidth) / 2);
    const maxY = Math.max(0, (img.clientHeight * scale.current - c.clientHeight) / 2);
    tx.current = clamp(tx.current, -maxX, maxX);
    ty.current = clamp(ty.current, -maxY, maxY);
  }

  // Zoom by `ratio` keeping the point at (px,py) screen coords fixed.
  function zoomAround(px: number, py: number, ratio: number) {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const ox = px - (rect.left + rect.width / 2);
    const oy = py - (rect.top + rect.height / 2);
    const next = clamp(scale.current * ratio, MIN, MAX);
    const real = next / scale.current;
    tx.current = ox - (ox - tx.current) * real;
    ty.current = oy - (oy - ty.current) * real;
    scale.current = next;
  }

  function reset() {
    scale.current = 1;
    tx.current = 0;
    ty.current = 0;
    clampPan();
    apply();
    setZoomed(false);
  }

  function syncZoomed() {
    setZoomed(scale.current > 1.01);
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Native wheel listener so we can preventDefault (desktop zoom).
    const c = containerRef.current;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAround(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
      clampPan();
      apply();
      syncZoomed();
    };
    c?.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      c?.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const n = pointers.current.size;
    if (n === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY };
      // double-tap detection
      const now = Date.now();
      const lt = lastTap.current;
      if (lt && now - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
        if (scale.current > 1.01) reset();
        else {
          zoomAround(e.clientX, e.clientY, 2.6);
          clampPan();
          apply();
          syncZoomed();
        }
        lastTap.current = null;
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      }
    } else if (n === 2) {
      lastDist.current = null;
      lastMid.current = null;
      lastPan.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (lastDist.current != null) {
        zoomAround(mid.x, mid.y, dist / lastDist.current);
        if (lastMid.current) {
          tx.current += mid.x - lastMid.current.x;
          ty.current += mid.y - lastMid.current.y;
        }
        clampPan();
        apply();
      }
      lastDist.current = dist;
      lastMid.current = mid;
    } else if (pts.length === 1 && scale.current > 1) {
      const p = pts[0];
      if (lastPan.current) {
        tx.current += p.x - lastPan.current.x;
        ty.current += p.y - lastPan.current.y;
        clampPan();
        apply();
      }
      lastPan.current = { x: p.x, y: p.y };
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      lastPan.current = { x: pts[0].x, y: pts[0].y };
      lastDist.current = null;
      lastMid.current = null;
    } else if (pts.length === 0) {
      lastPan.current = null;
      lastDist.current = null;
      lastMid.current = null;
      syncZoomed();
    }
  }

  function btnZoom(dir: 1 | -1) {
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    zoomAround(rect.left + rect.width / 2, rect.top + rect.height / 2, dir === 1 ? 1.4 : 1 / 1.4);
    clampPan();
    apply();
    syncZoomed();
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`${plan.label} floor plan`}>
      <div className="flex items-center justify-between px-4 py-3 text-paper shrink-0">
        <span className="font-semibold">{plan.label}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="size-9 grid place-items-center rounded-full bg-white/10 active:bg-white/20 tap"
        >
          <IconX size={20} />
        </button>
      </div>

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex-1 overflow-hidden grid place-items-center select-none"
        style={{ touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={plan.src}
          alt={`Seattle Mandir ${plan.label} floor plan`}
          draggable={false}
          className="max-w-full max-h-full object-contain will-change-transform"
          style={{ transformOrigin: "center center" }}
        />
        {!zoomed && (
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-paper/80 text-xs bg-ink/60 rounded-full px-3 py-1">
            Pinch, double-tap, or use + to zoom
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 py-4 shrink-0">
        <button
          type="button"
          onClick={() => btnZoom(-1)}
          aria-label="Zoom out"
          className="size-11 grid place-items-center rounded-full bg-white/10 text-paper active:bg-white/20 tap"
        >
          <IconMinus size={20} />
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-paper/90 text-sm font-medium px-3 py-2 rounded-full bg-white/10 active:bg-white/20 tap"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => btnZoom(1)}
          aria-label="Zoom in"
          className="size-11 grid place-items-center rounded-full bg-white/10 text-paper active:bg-white/20 tap"
        >
          <IconPlus size={20} />
        </button>
      </div>
    </div>
  );
}
