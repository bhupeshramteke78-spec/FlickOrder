import Link from "next/link";
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
  href,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  subcaption?: string;
  trend?: string;
  tone?: "emerald" | "amber" | "blue" | "rose" | "zinc" | "purple";
  href?: string;
  className?: string;
}) {
  const toneMap = {
    emerald: {
      icon: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      trendBadge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      accent: "hover:border-emerald-200",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600 border border-amber-100",
      trendBadge: "bg-amber-50 text-amber-700 border-amber-200/80",
      accent: "hover:border-amber-200",
    },
    blue: {
      icon: "bg-blue-50 text-blue-600 border border-blue-100",
      trendBadge: "bg-blue-50 text-blue-700 border-blue-200/80",
      accent: "hover:border-blue-200",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600 border border-rose-100",
      trendBadge: "bg-rose-50 text-rose-700 border-rose-200/80",
      accent: "hover:border-rose-200",
    },
    purple: {
      icon: "bg-purple-50 text-purple-600 border border-purple-100",
      trendBadge: "bg-purple-50 text-purple-700 border-purple-200/80",
      accent: "hover:border-purple-200",
    },
    zinc: {
      icon: "bg-zinc-100 text-zinc-600 border border-zinc-200",
      trendBadge: "bg-zinc-100 text-zinc-700 border-zinc-200",
      accent: "hover:border-zinc-300",
    },
  }[tone];

  const content = (
    <Card
      className={cn(
        "relative rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        href ? "cursor-pointer active:scale-[0.99]" : "",
        toneMap.accent,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", toneMap.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", toneMap.trendBadge)}>
            {trend}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-black tracking-tight text-zinc-950">{value}</p>
        {subcaption ? (
          <p className="mt-1 text-[11px] font-medium text-zinc-400 line-clamp-1">{subcaption}</p>
        ) : null}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}
