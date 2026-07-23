import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMinimumPlanForFeature, type PlanFeature } from "@/lib/billing-plans";
import { hasPlanFeature, type SubscriptionAccess } from "@/lib/subscription-access";

export function SubscriptionLock({
  access,
  feature,
  title,
  description,
}: {
  access: SubscriptionAccess | null;
  feature?: PlanFeature;
  title?: string;
  description?: string;
}) {
  const isUnlocked = feature ? hasPlanFeature(access, feature) : access?.canManageRestaurant;

  if (isUnlocked) {
    return null;
  }

  const minimumPlan = feature ? getMinimumPlanForFeature(feature) : null;

  return (
    <Card className="mb-5 border-amber-200 bg-amber-50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-amber-950">{title ?? (minimumPlan ? `${minimumPlan} plan required` : "Subscription required")}</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              {description ?? access?.message ?? (minimumPlan ? `Upgrade to ${minimumPlan} to use this feature.` : "Choose a plan to continue restaurant operations.")}
            </p>
          </div>
        </div>
        <Link href="/dashboard/billing">
          <Button type="button" className="w-full sm:w-auto">
            Choose a plan
          </Button>
        </Link>
      </div>
    </Card>
  );
}
