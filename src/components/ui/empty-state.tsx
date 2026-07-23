import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p>
    </Card>
  );
}
