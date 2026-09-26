"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronDown, 
  ExternalLink, 
  Copy, 
  Settings, 
  CreditCard, 
  LogOut, 
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { DashboardRestaurantOption } from "@/lib/dashboard-restaurant";

interface RestaurantProfileMenuProps {
  restaurantId: string | null;
  restaurantName: string;
  restaurantSlug?: string;
  memberRole: string;
  initials: string;
  restaurants: DashboardRestaurantOption[];
}

export function RestaurantProfileMenu({
  restaurantId,
  restaurantName,
  restaurantSlug,
  memberRole,
  initials,
  restaurants,
}: RestaurantProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function copyMenuLink() {
    if (!restaurantSlug) {
      toast.error("Restaurant QR menu link is not configured.");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/restaurants/${restaurantSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("📋 Customer QR Menu link copied to clipboard!");
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-98"
        aria-expanded={isOpen}
        aria-label="Restaurant and profile options"
      >
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-600 text-xs font-bold text-white shadow-xs">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold leading-tight text-zinc-900 truncate max-w-[120px]">{restaurantName}</p>
          <p className="text-[10px] font-medium text-zinc-500">{formatRole(memberRole)}</p>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Card */}
          <div className="rounded-xl bg-zinc-50 p-3 mb-1 border border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-600 text-sm font-black text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-950 truncate">{restaurantName}</p>
                <span className="inline-block mt-0.5 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                  {formatRole(memberRole)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="space-y-0.5 py-1 text-xs">
            {restaurantSlug && (
              <a
                href={`/restaurants/${restaurantSlug}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <ExternalLink className="h-3.5 w-3.5 text-rose-600" />
                <span>View Public QR Menu</span>
              </a>
            )}

            {restaurantSlug && (
              <button
                type="button"
                onClick={copyMenuLink}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 text-left"
              >
                <Copy className="h-3.5 w-3.5 text-blue-600" />
                <span>Copy Menu Link</span>
              </button>
            )}

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <Settings className="h-3.5 w-3.5 text-zinc-500" />
              <span>Restaurant Settings</span>
            </Link>

            <Link
              href="/dashboard/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Subscription & Billing</span>
            </Link>
          </div>

          {/* Multi-Restaurant Switcher if applicable */}
          {restaurants.length > 1 && (
            <div className="border-t border-zinc-100 pt-2 mt-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Switch Outlet
              </p>
              <div className="space-y-0.5">
                {restaurants.map((rest) => {
                  const isSelected = rest.restaurantId === restaurantId;
                  return (
                    <button
                      key={rest.restaurantId}
                      type="button"
                      disabled={isSelected}
                      onClick={async () => {
                        await fetch("/api/dashboard/restaurant-context", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ restaurantId: rest.restaurantId }),
                        });
                        window.location.reload();
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                        isSelected
                          ? "bg-rose-50 text-rose-900 font-bold"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 font-medium"
                      }`}
                    >
                      <span className="truncate">{rest.restaurantName}</span>
                      {isSelected ? <Check className="h-3.5 w-3.5 text-rose-600 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Logout Option */}
          <div className="border-t border-zinc-100 pt-1 mt-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
