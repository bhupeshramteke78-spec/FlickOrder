import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Star, Table2, Utensils } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Json } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap, type RestaurantAvailability } from "@/lib/table-availability";

type OpeningHours = {
  open: string;
  close: string;
};

type RestaurantDetail = {
  name: string;
  city: string;
  state: string;
  isOpen: boolean;
  openingHours: OpeningHours | null;
  availability: RestaurantAvailability;
};

export default async function RestaurantDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <section className="mx-auto max-w-6xl px-4 py-4">
        <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="overflow-hidden p-0">
          <div className="restaurant-photo h-60" />
          <div className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="grid h-24 w-24 place-items-center rounded-lg border border-zinc-200 bg-white text-center text-sm font-bold capitalize shadow-lg">
                  {restaurant.name.slice(0, 12)}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold">{restaurant.name}</h1>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                    <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> Rating from reviews</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {restaurant.city}, {restaurant.state}</span>
                    {restaurant.openingHours ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {restaurant.isOpen ? `Closes at ${formatClockTime(restaurant.openingHours.close)}` : `Opens at ${formatClockTime(restaurant.openingHours.open)}`}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <Link href={`/menu/${slug}/table/1?preview=true`}>
                <Button variant="glass" className="border-emerald-300/30 bg-emerald-800/70">View menu</Button>
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              <div className={`rounded-lg border p-4 ${restaurant.isOpen ? "border-emerald-100 bg-emerald-50" : "border-zinc-200 bg-zinc-50"}`}>
                <Badge tone={restaurant.isOpen ? "success" : "neutral"} className={restaurant.isOpen ? "text-emerald-700" : undefined}>
                  {restaurant.isOpen ? "Open" : "Closed"}
                </Badge>
                {restaurant.openingHours ? (
                  <span className="ml-3 text-sm text-zinc-600">
                    {restaurant.isOpen ? `Closes at ${formatClockTime(restaurant.openingHours.close)}` : `Opens at ${formatClockTime(restaurant.openingHours.open)}`}
                  </span>
                ) : null}
              </div>
              {restaurant.availability.totalTables > 0 ? (
                <div className={`rounded-lg border p-4 ${
                  restaurant.availability.isFull ? "border-rose-100 bg-rose-50" : "border-emerald-100 bg-white"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
                        <Table2 className="h-4 w-4 text-emerald-700" />
                        Live seating
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">{restaurant.availability.label}</p>
                    </div>
                    <Badge tone={restaurant.availability.isFull ? "danger" : "success"} className={restaurant.availability.isFull ? undefined : "text-emerald-700"}>
                      {restaurant.availability.isFull ? "Full" : "Seats available"}
                    </Badge>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Menu preview</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Real menu categories, availability, offers, and popular items render here when connected.</p>
          </Card>
          <Card>
            <h2 className="font-semibold">Highlights</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              <Utensils className="mr-2 inline h-4 w-4 text-emerald-700" />
              UPI, QR ordering, service requests, photos, directions, and reviews are mapped into the database model.
            </p>
          </Card>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

async function getRestaurant(slug: string): Promise<RestaurantDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,city,state,is_open")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("opening_hours")
    .eq("restaurant_id", data.id)
    .maybeSingle();
  const availabilityByRestaurantId = await getRestaurantAvailabilityMap(supabase, [data.id]);

  return {
    name: data.name,
    city: data.city,
    state: data.state,
    isOpen: data.is_open,
    openingHours: normalizeOpeningHours(settings?.opening_hours ?? null),
    availability: availabilityByRestaurantId.get(data.id) ?? emptyAvailability(),
  };
}

function normalizeOpeningHours(value: Json | null): OpeningHours | null {
  if (!isRecord(value) || typeof value.open !== "string" || typeof value.close !== "string") {
    return null;
  }

  return {
    open: value.open,
    close: value.close,
  };
}

function isRecord(value: Json | null): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatClockTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date).toUpperCase();
}
