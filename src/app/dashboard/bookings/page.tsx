import { CalendarDays, Clock3, MessageSquareText, Phone, Users } from "lucide-react";
import { BookingActions } from "@/components/dashboard/bookings/booking-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { formatBookingDate, formatBookingTime, getIndiaDateString } from "@/lib/bookings";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function BookingsPage() {
  const context = await getBookingsContext();

  return (
    <DashboardShell title="Table bookings" eyebrow="Guest reservations">
      {!context.canView ? (
        <PermissionLock description="This staff role cannot view restaurant bookings." />
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Pending" value={context.bookings.filter((booking) => booking.status === "PENDING").length} />
            <Metric label="Confirmed" value={context.bookings.filter((booking) => booking.status === "CONFIRMED").length} />
            <Metric label="Guests expected" value={context.bookings.filter((booking) => booking.status === "CONFIRMED").reduce((sum, booking) => sum + booking.party_size, 0)} />
          </div>

          {context.bookings.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {context.bookings.map((booking) => (
                <article key={booking.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-950">{booking.customer_name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{booking.confirmation_code}</p>
                    </div>
                    <Badge tone={booking.status === "CONFIRMED" ? "success" : booking.status === "PENDING" ? "warning" : "neutral"}>
                      {booking.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                    <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-700" />{formatBookingDate(booking.booking_date)}</p>
                    <p className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-700" />{formatBookingTime(booking.booking_time)}</p>
                    <p className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-emerald-700" />{booking.party_size} guests · Table {context.tableNumbers.get(booking.table_id ?? "") ?? "to assign"}</p>
                    <p className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-700" />{booking.customer_phone}</p>
                    {booking.special_request ? <p className="inline-flex items-start gap-2"><MessageSquareText className="mt-0.5 h-4 w-4 text-emerald-700" />{booking.special_request}</p> : null}
                  </div>
                  {context.canManage ? <BookingActions bookingId={booking.id} status={booking.status} /> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="No upcoming bookings" description="New table bookings will appear here instantly." />
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

async function getBookingsContext() {
  const fallback = {
    canView: false,
    canManage: false,
    bookings: [],
    tableNumbers: new Map<string, string>(),
  };

  if (!isSupabaseConfigured()) {
    return fallback;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context || !hasPermission(context.selected.memberRole, "viewBookings")) {
    return fallback;
  }

  const today = getIndiaDateString();
  const [{ data: bookings }, { data: tables }] = await Promise.all([
    supabase
      .from("restaurant_bookings")
      .select("id,table_id,customer_name,customer_phone,party_size,booking_date,booking_time,special_request,status,confirmation_code")
      .eq("restaurant_id", context.selected.restaurantId)
      .gte("booking_date", today)
      .in("status", ["PENDING", "CONFIRMED"])
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true }),
    supabase.from("tables").select("id,table_number").eq("restaurant_id", context.selected.restaurantId),
  ]);

  return {
    canView: true,
    canManage: hasPermission(context.selected.memberRole, "manageBookings"),
    bookings: bookings ?? [],
    tableNumbers: new Map((tables ?? []).map((table) => [table.id, table.table_number])),
  };
}
