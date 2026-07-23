import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
