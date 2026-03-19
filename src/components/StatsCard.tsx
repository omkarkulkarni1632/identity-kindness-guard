import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "danger" | "warning" | "success";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  danger: "border-destructive/30",
  warning: "border-warning/30",
  success: "border-success/30",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function StatsCard({ title, value, icon: Icon, trend, variant = "default", className }: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-5 animate-slide-in", variantStyles[variant], className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
