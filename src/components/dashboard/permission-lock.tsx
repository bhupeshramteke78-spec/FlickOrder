import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PermissionLock({
  title = "Access restricted",
  description = "Your staff role does not have permission to open this section.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-800">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-rose-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-rose-800">{description}</p>
          </div>
        </div>
        <Link href="/dashboard/orders">
          <Button type="button" variant="secondary" className="w-full sm:w-auto">
            Go to orders
          </Button>
        </Link>
      </div>
    </Card>
  );
}
