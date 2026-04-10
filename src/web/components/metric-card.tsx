import { cn } from "@/web/lib/utils";

export function MetricCard({
  title,
  value,
  accent,
  detail,
}: {
  title: string;
  value: string | number;
  accent: string;
  detail: string;
}) {
  return (
    <div className="glass-panel rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{title}</p>
        <span
          className={cn("status-dot")}
          style={{ backgroundColor: accent }}
        />
      </div>
      <p className="mt-4 text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-3 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}
