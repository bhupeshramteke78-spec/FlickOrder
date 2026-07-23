import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTrialStatus(trialEndsAt: string | null) {
  if (!trialEndsAt) {
    return { label: "No trial", expired: true, daysLeft: 0 };
  }

  const now = new Date();
  const end = new Date(trialEndsAt);
  const msLeft = end.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return {
    label: daysLeft > 0 ? `${daysLeft} Day${daysLeft === 1 ? "" : "s"} Left` : "Expired",
    expired: daysLeft === 0,
    daysLeft,
  };
}
