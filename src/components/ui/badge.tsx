import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "border-zinc-200 bg-zinc-50 text-zinc-600",
        tone === "success" && "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
        tone === "warning" && "border-amber-300/20 bg-amber-300/10 text-amber-200",
        tone === "danger" && "border-red-900/20 bg-red-50 text-red-900",
        className,
      )}
      {...props}
    />
  );
}
