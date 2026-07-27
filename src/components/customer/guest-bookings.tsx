"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type StoredBooking = { id: string; token: string; restaurantName: string; confirmationCode: string };

export function GuestBookings() {
  const [bookings, setBookings] = useState<StoredBooking[] | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const value = JSON.parse(window.localStorage.getItem("flickorder_guest_bookings") ?? "[]") as unknown;
        setBookings(Array.isArray(value) ? value.filter(isStoredBooking) : []);
      } catch {
        setBookings([]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (bookings === null) return <div className="h-48 animate-pulse rounded-lg bg-zinc-200" />;
  if (bookings.length === 0) return <EmptyState icon={CalendarDays} title="No bookings on this device" description="Bookings you make without login are stored securely on this device." />;

  return (
    <div className="grid gap-3">
      {bookings.map((booking) => (
        <Link key={booking.id} href={`/bookings/${booking.id}?token=${encodeURIComponent(booking.token)}`} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-emerald-300">
          <div>
            <p className="font-semibold">{booking.restaurantName}</p>
            <p className="mt-1 text-xs text-zinc-500">{booking.confirmationCode}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </Link>
      ))}
    </div>
  );
}

function isStoredBooking(value: unknown): value is StoredBooking {
  return typeof value === "object" && value !== null && "id" in value && "token" in value && "restaurantName" in value && typeof value.id === "string" && typeof value.token === "string" && typeof value.restaurantName === "string";
}
