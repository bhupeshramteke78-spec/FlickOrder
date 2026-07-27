"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, Loader2, Mail, Phone, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBookingTime, getBookingSlots, type BookingConfig } from "@/lib/bookings";

type BookingFormProps = {
  restaurantSlug: string;
  minDate: string;
  maxDate: string;
  maxPartySize: number;
  bookingConfig: BookingConfig;
  initialCustomerName: string;
  initialCustomerPhone: string;
  customerEmail: string;
};

export function BookingForm({
  restaurantSlug,
  minDate,
  maxDate,
  maxPartySize,
  bookingConfig,
  initialCustomerName,
  initialCustomerPhone,
  customerEmail,
}: BookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [bookingDate, setBookingDate] = useState(minDate);
  const [bookingTime, setBookingTime] = useState("");
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [specialRequest, setSpecialRequest] = useState("");
  const visiblePartySizes = useMemo(() => Array.from({ length: Math.min(maxPartySize, 10) }, (_, index) => index + 1), [maxPartySize]);
  const slots = useMemo(() => getBookingSlots(bookingConfig, bookingDate), [bookingConfig, bookingDate]);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bookingTime) {
      toast.error("Choose a booking time.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantSlug, customerName, customerPhone, partySize, bookingDate, bookingTime, specialRequest }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        bookingId?: string;
        statusUrl?: string;
        confirmationCode?: string;
      } | null;

      if (!response.ok || !body?.bookingId || !body.statusUrl) {
        if (response.status === 401) {
          router.push(`/auth/customer?mode=login&returnTo=${encodeURIComponent(`/restaurants/${restaurantSlug}/book`)}`);
          return;
        }
        toast.error(body?.error ?? "Unable to book the table.");
        return;
      }

      toast.success("Your table reservation request has been submitted successfully.");
      router.push(body.statusUrl);
    } catch {
      toast.error("Unable to reach FlickOrder. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitBooking} className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-zinc-950">How many guests?</p>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {visiblePartySizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setPartySize(size)}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-sm font-semibold transition ${
                partySize === size ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-emerald-700" />Date</span>
          <Input
            type="date"
            min={minDate}
            max={maxDate}
            required
            value={bookingDate}
            onChange={(event) => {
              setBookingDate(event.target.value);
              setBookingTime("");
            }}
          />
        </label>
        <div>
          <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-emerald-700" />Time</span>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setBookingTime(slot)}
                className={`h-11 rounded-lg border px-2 text-sm font-semibold transition ${
                  bookingTime === slot ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300"
                }`}
              >
                {formatBookingTime(slot)}
              </button>
            ))}
          </div>
          {slots.length === 0 ? <p className="mt-2 text-xs text-amber-700">No remaining slots on this date. Choose another day.</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-emerald-700" />Your name</span>
          <Input required minLength={2} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Name for the booking" />
        </label>
        <label>
          <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><Phone className="h-4 w-4 text-emerald-700" />Mobile number</span>
          <Input required type="tel" minLength={7} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Restaurant can contact you" />
        </label>
      </div>

      <label>
        <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4 text-emerald-700" />
          Account email
        </span>
        <Input
          type="email"
          value={customerEmail}
          readOnly
          aria-readonly="true"
          className="cursor-not-allowed bg-zinc-50 text-zinc-600"
        />
        <span className="mt-1.5 block text-xs text-zinc-500">This comes from your signed-in FlickOrder account.</span>
      </label>

      <label>
        <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-emerald-700" />Special request <span className="font-normal text-zinc-400">(optional)</span></span>
        <textarea
          maxLength={500}
          value={specialRequest}
          onChange={(event) => setSpecialRequest(event.target.value)}
          className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          placeholder="High chair, accessibility, celebration, or seating preference"
        />
      </label>

      <Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
        Request this table
      </Button>
      <p className="text-center text-xs leading-5 text-zinc-500">The restaurant will confirm your request. No payment is collected for booking.</p>
    </form>
  );
}
