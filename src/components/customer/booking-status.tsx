"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, Clock3, Loader2, MapPin, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBookingDate, formatBookingTime } from "@/lib/bookings";

type BookingResponse = {
  booking: {
    id: string;
    customerName: string;
    partySize: number;
    bookingDate: string;
    bookingTime: string;
    specialRequest: string | null;
    status: string;
    confirmationCode: string;
    declineReason: string | null;
    tableNumber: string | null;
  };
  restaurant: {
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    googleMapsUrl: string | null;
  } | null;
};

export function BookingStatus({ bookingId, token }: { bookingId: string; token: string }) {
  const [data, setData] = useState<BookingResponse | null>(null);
  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    const response = await fetch(`/api/bookings/${bookingId}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as BookingResponse & { error?: string };
    if (!response.ok) {
      setError(body?.error ?? "Unable to load this booking.");
      return;
    }
    setData(body);
    setError("");
  }, [bookingId, token]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadBooking(), 0);
    const timer = window.setInterval(() => void loadBooking(), 12_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadBooking]);

  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">{error}</div>;
  if (!data) return <div className="grid min-h-80 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-700" /></div>;

  const state = statusState(data.booking.status);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
      <div className={`grid h-14 w-14 place-items-center rounded-full ${state.iconClass}`}>
        {state.accepted ? <Check className="h-7 w-7" /> : state.declined ? <X className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
      </div>
      <p className="mt-5 text-sm font-semibold uppercase text-emerald-700">{data.booking.confirmationCode}</p>
      <h1 className="mt-1 text-3xl font-semibold">{state.title}</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{state.description}</p>
      {data.booking.declineReason ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{data.booking.declineReason}</p> : null}

      <div className="mt-7 grid gap-4 border-y border-zinc-200 py-5 sm:grid-cols-3">
        <p className="inline-flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-emerald-700" />{formatBookingDate(data.booking.bookingDate)}</p>
        <p className="inline-flex items-center gap-2 text-sm"><Clock3 className="h-4 w-4 text-emerald-700" />{formatBookingTime(data.booking.bookingTime)}</p>
        <p className="inline-flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-emerald-700" />{data.booking.partySize} guests</p>
      </div>

      {data.restaurant ? (
        <div className="mt-5">
          <h2 className="text-lg font-semibold">{data.restaurant.name}</h2>
          <p className="mt-2 inline-flex items-start gap-2 text-sm leading-6 text-zinc-600"><MapPin className="mt-1 h-4 w-4 shrink-0" />{data.restaurant.address}, {data.restaurant.city}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/restaurants/${data.restaurant.slug}`}><Button variant="secondary">Restaurant details</Button></Link>
            <Link href="/customer/bookings"><Button>My bookings</Button></Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function statusState(status: string) {
  if (status === "CONFIRMED") return { accepted: true, declined: false, title: "Your table is confirmed", description: "The restaurant has accepted your booking. Please arrive near your reserved time.", iconClass: "bg-emerald-100 text-emerald-700" };
  if (status === "DECLINED" || status === "CANCELLED") return { accepted: false, declined: true, title: "Booking not confirmed", description: "This booking cannot be accommodated. You can choose another restaurant or time.", iconClass: "bg-rose-100 text-rose-700" };
  if (status === "COMPLETED") return { accepted: true, declined: false, title: "Visit completed", description: "Thanks for dining with FlickOrder.", iconClass: "bg-emerald-100 text-emerald-700" };
  if (status === "NO_SHOW") return { accepted: false, declined: true, title: "Booking closed", description: "The restaurant marked this reservation as a no-show.", iconClass: "bg-zinc-200 text-zinc-700" };
  return { accepted: false, declined: false, title: "Waiting for confirmation", description: "Your request reached the restaurant. This page updates automatically when staff respond.", iconClass: "bg-amber-100 text-amber-700" };
}
