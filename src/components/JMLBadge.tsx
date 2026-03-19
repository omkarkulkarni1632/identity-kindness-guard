import { cn } from "@/lib/utils";
import { UserPlus, ArrowRightLeft, UserMinus, UserCheck } from "lucide-react";

type JMLStage = "joiner" | "mover" | "leaver" | "active";

const config: Record<JMLStage, { label: string; class: string; icon: typeof UserPlus }> = {
  joiner: { label: "Joiner", class: "bg-success/15 text-success border-success/30", icon: UserPlus },
  mover: { label: "Mover", class: "bg-warning/15 text-warning border-warning/30", icon: ArrowRightLeft },
  leaver: { label: "Leaver", class: "bg-destructive/15 text-destructive border-destructive/30", icon: UserMinus },
  active: { label: "Active", class: "bg-primary/15 text-primary border-primary/30", icon: UserCheck },
};

export function JMLBadge({ stage, className }: { stage: JMLStage; className?: string }) {
  const c = config[stage] ?? config.active;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", c.class, className)}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
