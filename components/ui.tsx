// Shared UI primitives + class strings, inherited from content.md's design system.
// No emoji anywhere; icons are SVG (stroke, currentColor, 24x24).
import type { ReactNode, SVGProps } from "react";

export const card = "bg-card rounded-2xl border border-line";
export const cardPad = "bg-card rounded-2xl border border-line p-5";

export const btnPrimary =
  "rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2 active:scale-[0.97] transition-transform disabled:opacity-50 cursor-pointer tap";
export const btnGhost =
  "rounded-lg border border-line bg-card text-sm font-medium px-4 py-2 active:scale-[0.97] transition-transform disabled:opacity-50 hover:border-muted cursor-pointer tap";
export const btnDanger =
  "rounded-lg border border-brand/40 text-brand text-sm font-semibold px-4 py-2 active:scale-[0.97] transition-transform disabled:opacity-50 cursor-pointer tap";
export const btnFull =
  "w-full rounded-xl bg-brand text-white font-semibold py-3 text-base active:scale-[0.98] transition-transform disabled:opacity-60 cursor-pointer tap";

export const inputCls =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/40 transition-shadow";
export const inputSm =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/40 transition-shadow";

export function NishanBar({ className = "" }: { className?: string }) {
  return <div className={`nishan-bar ${className}`} aria-hidden="true" />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${card} ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted text-xs font-semibold uppercase tracking-wider">{children}</div>
  );
}

export function StatusPill({ status }: { status: "open" | "closed" | "draft" }) {
  const base =
    "inline-block text-[11px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-0.5";
  const map = {
    open: "bg-success-soft text-success border-success/30",
    closed: "bg-paper text-muted border-line",
    draft: "bg-gold-soft text-gold-deep border-gold/40",
  } as const;
  return <span className={`${base} ${map[status]}`}>{status}</span>;
}

// ----------------------------------------------------------------- icons
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function Svg({ size = 24, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </Svg>
);
export const IconMap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3 4 5v16l5-2 6 2 5-2V3l-5 2-6-2Z" />
    <path d="M9 3v16M15 5v16" />
  </Svg>
);
export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
export const IconTrophy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14.5h6M9 20h6M12 14.5V20" />
  </Svg>
);
export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
  </Svg>
);
export const IconFood = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.7 0-3 2-3 4.5S15.3 12 17 12v9" />
  </Svg>
);
export const IconFlame = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-.7-.2-1.3-.5-1.8C16 10 17 12.5 17 14.5a5 5 0 0 1-10 0C7 10.5 10 7 12 3Z" />
  </Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 6.5" />
  </Svg>
);
export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);
export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 3v6c0 4-3 6.7-7 9-4-2.3-7-5-7-9V6l7-3Z" />
  </Svg>
);
export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 12H3M6 8l-3 4 3 4" />
  </Svg>
);
export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconMinus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);
export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IconSwap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </Svg>
);
