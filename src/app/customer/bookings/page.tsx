import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight, Clock3, Users } from "lucide-react";
import { CustomerAccountActions } from "@/components/customer/customer-account-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBookingDate, formatBookingTime } from "@/lib/bookings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerBookingsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/auth/customer?mode=login&returnTo=%2Fcustomer%2Fbookings");
  }

  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from("restaurant_bookings")
    .select("id,restaurant_id,party_size,booking_date,booking_time,special_request,status,confirmation_code,created_at")
    .eq("customer_id", auth.user.id)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false });
  const restaurantIds = [...new Set((bookings ?? []).map((booking) => booking.restaurant_id))];
  const { data: restaurants } = restaurantIds.length
    ? await admin.from("restaurants").select("id,name,slug").in("id", restaurantIds)
    : { data: [] };
  const restaurantById = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant]));

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-zinc-950 sm:py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/restaurants/search" className="inline-flex items-center gap-2 text-sm text-zinc-600">
          <ArrowLeft className="h-4 w-4" />Explore restaurants
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Customer account</p>
            <h1 className="mt-1 text-3xl font-semibold">My bookings</h1>
            <p className="mt-2 text-sm text-zinc-500">Every table request connected to your FlickOrder account.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CustomerAccountActions />
            <Link href="/restaurants/search" className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
              Find a restaurant
            </Link>
          </div>
        </div>

        {(bookings ?? []).length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={CalendarDays} title="No bookings yet" description="Choose a restaurant and request a table to see it here." />
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {(bookings ?? []).map((booking) => {
              const restaurant = restaurantById.get(booking.restaurant_id);

              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="group grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{restaurant?.name ?? "Restaurant"}</h2>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-1 text-xs font-medium text-zinc-500">{booking.confirmation_code}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-emerald-700" />{formatBookingDate(booking.booking_date)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-emerald-700" />{formatBookingTime(booking.booking_time)}</span>
                      <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-emerald-700" />{booking.party_size} guests</span>
                    </div>
                    {booking.special_request ? (
                      <p className="mt-3 line-clamp-2 text-sm text-zinc-500">
                        Request: {booking.special_request}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "CONFIRMED" || status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DECLINED" || status === "CANCELLED" || status === "NO_SHOW"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${tone}`}>{status.replace("_", " ")}</span>;
}
