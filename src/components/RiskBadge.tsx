import { cn } from "@/lib/utils";

type RiskLevel = "critical" | "high" | "medium" | "low";

const config: Record<RiskLevel, { label: string; class: string }> = {
  critical: { label: "Critical", class: "bg-destructive/15 text-destructive border-destructive/30" },
  high: { label: "High", class: "bg-warning/15 text-warning border-warning/30" },
  medium: { label: "Medium", class: "bg-info/15 text-info border-info/30" },
  low: { label: "Low", class: "bg-success/15 text-success border-success/30" },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const c = config[level] ?? config.low;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", c.class, className)}>
      {c.label}
    </span>
  );
}
