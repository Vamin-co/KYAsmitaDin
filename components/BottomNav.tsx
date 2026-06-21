"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconTrophy, IconFood, IconUser, IconMap } from "./ui";

const items = [
  { href: "/schedule", label: "Schedule", Icon: IconCalendar },
  { href: "/maps", label: "Maps", Icon: IconMap },
  { href: "/trivia", label: "Trivia", Icon: IconTrophy },
  { href: "/menu", label: "Menu", Icon: IconFood },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="max-w-md mx-auto grid grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] tap transition-colors ${
                active ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.1 : 1.8} />
              <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
