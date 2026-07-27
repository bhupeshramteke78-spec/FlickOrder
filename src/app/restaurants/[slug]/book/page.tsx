import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, ShieldCheck, Table2 } from "lucide-react";
import { BookingForm } from "@/components/customer/booking-form";
import type { Json } from "@/lib/database.types";
import { addDaysToDateString, defaultBookingConfig, getIndiaDateString, type BookingConfig } from "@/lib/bookings";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function BookRestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBookingRestaurant(slug);
  if (!data) notFound();

  const today = getIndiaDateString();
  const maxDate = addDaysToDateString(today, data.config.advanceDays);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-6 lg:py-10">
        <aside>
          <Link href={`/restaurants/${slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600"><ArrowLeft className="h-4 w-4" />Restaurant details</Link>
          <div className="mt-5 overflow-hidden rounded-lg bg-[#071117] text-white">
            <div className="aspect-[16/10] bg-zinc-800 bg-cover bg-center" style={data.coverUrl ? { backgroundImage: `url("${data.coverUrl}")` } : undefined} />
            <div className="p-5">
              <p className="text-xs font-semibold uppercase text-orange-400">Table booking</p>
              <h1 className="mt-2 text-2xl font-semibold">{data.name}</h1>
              <p className="mt-3 inline-flex items-start gap-2 text-sm leading-6 text-zinc-300"><MapPin className="mt-1 h-4 w-4 shrink-0" />{data.address}, {data.city}</p>
              <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm text-zinc-300">
                <p className="inline-flex items-center gap-2"><Table2 className="h-4 w-4 text-emerald-300" />Tables are assigned by party size</p>
                <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Restaurant confirmation required</p>
              </div>
            </div>
          </div>
        </aside>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-emerald-700">Reserve your visit</p>
          <h2 className="mt-1 text-2xl font-semibold">Choose your table time</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Send a real booking request to {data.name}. You can track confirmation from this device.</p>
          {!data.config.enabled ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Online booking is not available for this restaurant right now.</div>
          ) : (
            <div className="mt-7">
              <BookingForm
                restaurantName={data.name}
                restaurantSlug={slug}
                minDate={today}
                maxDate={maxDate}
                maxPartySize={Math.min(data.config.maxPartySize, data.maxTableSeats)}
                bookingConfig={data.config}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

async function getBookingRestaurant(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id,name,slug,address,city,cover_url")
    .eq("slug", slug).eq("verification_status", "APPROVED").is("deleted_at", null).is("deletion_requested_at", null).maybeSingle();
  if (!restaurant) return null;

  const [{ data: settings }, { data: tables }] = await Promise.all([
    admin.from("restaurant_settings").select("opening_hours,booking_enabled,booking_slot_minutes,booking_duration_minutes,booking_advance_days,booking_min_notice_minutes,booking_max_party_size").eq("restaurant_id", restaurant.id).maybeSingle(),
    admin.from("tables").select("seats").eq("restaurant_id", restaurant.id),
  ]);
  const openingHours = isRecord(settings?.opening_hours) ? settings.opening_hours : null;
  const config: BookingConfig = {
    enabled: settings?.booking_enabled ?? false,
    openTime: typeof openingHours?.open === "string" ? openingHours.open : defaultBookingConfig.openTime,
    closeTime: typeof openingHours?.close === "string" ? openingHours.close : defaultBookingConfig.closeTime,
    slotMinutes: settings?.booking_slot_minutes ?? defaultBookingConfig.slotMinutes,
    durationMinutes: settings?.booking_duration_minutes ?? defaultBookingConfig.durationMinutes,
    advanceDays: settings?.booking_advance_days ?? defaultBookingConfig.advanceDays,
    minNoticeMinutes: settings?.booking_min_notice_minutes ?? defaultBookingConfig.minNoticeMinutes,
    maxPartySize: settings?.booking_max_party_size ?? defaultBookingConfig.maxPartySize,
  };

  return {
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    coverUrl: restaurant.cover_url,
    config,
    maxTableSeats: Math.max(1, ...(tables ?? []).map((table) => table.seats)),
  };
}

function isRecord(value: Json | null | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
