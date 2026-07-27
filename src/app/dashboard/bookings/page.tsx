import { CalendarDays, Clock3, History, Mail, MessageSquareText, Phone, Users } from "lucide-react";
import { BookingActions } from "@/components/dashboard/bookings/booking-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBookingDate, formatBookingTime } from "@/lib/bookings";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function BookingsPage() {
  const context = await getBookingsContext();
  const activeBookings = context.bookings.filter(
    (booking) => booking.status === "PENDING" || booking.status === "CONFIRMED",
  );
  const bookingHistory = context.bookings.filter(
    (booking) => booking.status !== "PENDING" && booking.status !== "CONFIRMED",
  );

  return (
    <DashboardShell title="Table bookings" eyebrow="Guest reservations">
      {!context.canView ? (
        <PermissionLock description="This staff role cannot view restaurant bookings." />
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Pending" value={activeBookings.filter((booking) => booking.status === "PENDING").length} />
            <Metric label="Confirmed" value={activeBookings.filter((booking) => booking.status === "CONFIRMED").length} />
            <Metric
              label="Guests expected"
              value={activeBookings
                .filter((booking) => booking.status === "CONFIRMED")
                .reduce((sum, booking) => sum + booking.party_size, 0)}
            />
          </div>

          {activeBookings.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {activeBookings.map((booking) => (
                <article key={booking.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-950">{booking.customer_name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{booking.confirmation_code}</p>
                    </div>
                    <Badge tone={booking.status === "CONFIRMED" ? "success" : "warning"}>
                      {booking.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-emerald-700" />
                      {formatBookingDate(booking.booking_date)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-emerald-700" />
                      {formatBookingTime(booking.booking_time)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-700" />
                      {booking.party_size} guests · Table {context.tableNumbers.get(booking.table_id ?? "") ?? "to assign"}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-700" />
                      {booking.customer_phone}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-700" />
                      {context.customerEmails.get(booking.customer_id ?? "") || "No account email"}
                    </p>
                    {booking.special_request ? (
                      <p className="inline-flex items-start gap-2">
                        <MessageSquareText className="mt-0.5 h-4 w-4 text-emerald-700" />
                        {booking.special_request}
                      </p>
                    ) : null}
                    <p className="text-xs text-zinc-400">Requested {formatCreatedAt(booking.created_at)}</p>
                  </div>
                  {context.canManage ? <BookingActions bookingId={booking.id} status={booking.status} /> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming bookings"
              description="New table bookings will appear here instantly."
            />
          )}

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <p className="inline-flex items-center gap-2 font-semibold text-zinc-950">
                  <History className="h-4 w-4 text-emerald-700" />
                  Reservation history
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Recently completed, cancelled, declined, and missed reservations.
                </p>
              </div>
              <Badge tone="neutral">{bookingHistory.length}</Badge>
            </div>
            {bookingHistory.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {bookingHistory.map((booking) => (
                  <div key={booking.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-zinc-950">{booking.customer_name}</p>
                      <p className="mt-1 text-zinc-500">
                        {formatBookingDate(booking.booking_date)} · {formatBookingTime(booking.booking_time)} ·{" "}
                        {booking.party_size} guests
                      </p>
                    </div>
                    <Badge tone={booking.status === "COMPLETED" ? "success" : "neutral"}>
                      {booking.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-zinc-500">No reservation history yet.</p>
            )}
          </section>
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
    customerEmails: new Map<string, string>(),
  };

  if (!isSupabaseConfigured()) {
    return fallback;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context || !hasPermission(context.selected.memberRole, "viewBookings")) {
    return fallback;
  }

  const [{ data: bookings }, { data: tables }] = await Promise.all([
    supabase
      .from("restaurant_bookings")
      .select(
        "id,table_id,customer_id,customer_name,customer_phone,party_size,booking_date,booking_time,special_request,status,confirmation_code,created_at",
      )
      .eq("restaurant_id", context.selected.restaurantId)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })
      .limit(200),
    supabase.from("tables").select("id,table_number").eq("restaurant_id", context.selected.restaurantId),
  ]);
  const activeCustomerIds = [
    ...new Set(
      (bookings ?? []).flatMap((booking) =>
        booking.customer_id && (booking.status === "PENDING" || booking.status === "CONFIRMED")
          ? [booking.customer_id]
          : [],
      ),
    ),
  ];
  const admin = createAdminClient();
  const customerEmailEntries = await Promise.all(
    activeCustomerIds.map(async (customerId) => {
      const { data } = await admin.auth.admin.getUserById(customerId);
      return [customerId, data.user?.email ?? ""] as const;
    }),
  );

  return {
    canView: true,
    canManage: hasPermission(context.selected.memberRole, "manageBookings"),
    bookings: bookings ?? [],
    tableNumbers: new Map((tables ?? []).map((table) => [table.id, table.table_number])),
    customerEmails: new Map(customerEmailEntries),
  };
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
