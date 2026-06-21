"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Questions", exact: true },
  { href: "/admin/standings", label: "Standings" },
  { href: "/admin/delegates", label: "Delegates" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/menu", label: "Menu" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-line mb-5 overflow-x-auto">
      <nav className="flex gap-1 -mb-px min-w-max" aria-label="Admin sections">
        {tabs.map((t) => {
          const active = t.exact
            ? pathname === t.href || pathname.startsWith("/admin/questions")
            : pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors tap ${
                active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
