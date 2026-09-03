import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  subcaption,
  trend,
  tone = "emerald",
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  subcaption?: string;
  trend?: string;
  tone?: "emerald" | "amber" | "blue" | "rose" | "zinc";
  className?: string;
}) {
  const toneMap = {
    emerald: {
      icon: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      trend: "text-emerald-400",
      accent: "hover:border-emerald-500/30",
    },
    amber: {
      icon: "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      trend: "text-amber-400",
      accent: "hover:border-amber-500/30",
    },
    blue: {
      icon: "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
      trend: "text-blue-400",
      accent: "hover:border-blue-500/30",
    },
    rose: {
      icon: "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
      trend: "text-rose-400",
      accent: "hover:border-rose-500/30",
    },
    zinc: {
      icon: "bg-white/10 text-zinc-300 border border-white/10",
      trend: "text-zinc-400",
      accent: "hover:border-white/20",
    },
  }[tone];

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5", toneMap.accent, className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="truncate text-3xl font-black tracking-tight text-zinc-950">{value}</p>
            {trend ? (
              <span className={cn("text-xs font-bold", toneMap.trend)}>
                {trend}
              </span>
            ) : null}
          </div>
          {subcaption ? (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{subcaption}</p>
          ) : null}
        </div>

        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", toneMap.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
