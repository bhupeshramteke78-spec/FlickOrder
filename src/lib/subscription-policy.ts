export const TRIAL_ABANDONED_DELETE_DAYS = 30;
export const PAID_SUBSCRIPTION_GRACE_DAYS = 1;

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function getPaidSubscriptionGraceEndsAt(currentPeriodEndsAt: string | null) {
  if (!currentPeriodEndsAt) {
    return null;
  }

  return addDays(new Date(currentPeriodEndsAt), PAID_SUBSCRIPTION_GRACE_DAYS);
}

export function getAbandonedTrialDeletionAt(trialEndsAt: string | null) {
  if (!trialEndsAt) {
    return null;
  }

  return addDays(new Date(trialEndsAt), TRIAL_ABANDONED_DELETE_DAYS);
}

export function isWithinPaidGracePeriod(currentPeriodEndsAt: string | null, now = new Date()) {
  if (!currentPeriodEndsAt) {
    return false;
  }

  const periodEnd = new Date(currentPeriodEndsAt);
  const graceEnd = getPaidSubscriptionGraceEndsAt(currentPeriodEndsAt);

  return Boolean(graceEnd && periodEnd.getTime() <= now.getTime() && now.getTime() < graceEnd.getTime());
}

export function isAbandonedTrialPastDeletionDate(trialEndsAt: string | null, now = new Date()) {
  const deletionAt = getAbandonedTrialDeletionAt(trialEndsAt);

  return Boolean(deletionAt && deletionAt.getTime() <= now.getTime());
}
