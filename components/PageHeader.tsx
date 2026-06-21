import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight text-ink">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
