import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, ExternalLink, MapPin, Star, Table2, Utensils } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Json } from "@/lib/database.types";
import { buildDirectionsUrl } from "@/lib/maps";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap, type RestaurantAvailability } from "@/lib/table-availability";
import { formatCurrency } from "@/lib/utils";

type OpeningHours = { open: string; close: string };
type MenuPreviewItem = { id: string; name: string; imageUrl: string | null; price: number; offerPrice: number | null; category: string };
type RestaurantDetail = {
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  state: string;
  address: string;
  coverUrl: string | null;
  logoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  isOpen: boolean;
  openingHours: OpeningHours | null;
  bookingEnabled: boolean;
  availability: RestaurantAvailability;
  directionsUrl: string;
  menuItems: MenuPreviewItem[];
};

export default async function RestaurantDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <Link href="/restaurants/search" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950">
          <ArrowLeft className="h-4 w-4" /> Explore restaurants
        </Link>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div
            className="relative min-h-64 bg-zinc-200 bg-cover bg-center sm:min-h-80"
            style={restaurant.coverUrl ? { backgroundImage: `linear-gradient(0deg, rgba(7,17,23,.62), rgba(7,17,23,.04)), url("${restaurant.coverUrl}")` } : undefined}
          >
            {!restaurant.coverUrl ? <div className="restaurant-photo absolute inset-0" /> : null}
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 text-white">
              {restaurant.logoUrl ? <div className="h-20 w-20 rounded-lg border-2 border-white bg-white bg-contain bg-center bg-no-repeat shadow-lg" style={{ backgroundImage: `url("${restaurant.logoUrl}")` }} /> : null}
              <div>
                <h1 className="text-3xl font-semibold sm:text-4xl">{restaurant.name}</h1>
                <p className="mt-1 text-sm text-white/80">{restaurant.cuisine.join(", ") || restaurant.type}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-zinc-600">
              {restaurant.rating != null ? <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-500" />{restaurant.rating.toFixed(1)} · {restaurant.reviewCount} reviews</span> : null}
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{restaurant.city}, {restaurant.state}</span>
              {restaurant.openingHours ? <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{restaurant.isOpen ? `Closes ${formatClockTime(restaurant.openingHours.close)}` : `Opens ${formatClockTime(restaurant.openingHours.open)}`}</span> : null}
              <span className="inline-flex items-center gap-1.5"><Table2 className="h-4 w-4" />{restaurant.availability.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={restaurant.directionsUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary"><ExternalLink className="h-4 w-4" />Directions</Button>
              </a>
              <Link href={`/menu/${slug}/table/1?preview=true`}><Button variant="secondary"><Utensils className="h-4 w-4" />View menu</Button></Link>
              {restaurant.bookingEnabled ? <Link href={`/restaurants/${slug}/book`}><Button><CalendarDays className="h-4 w-4" />Book a table</Button></Link> : null}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.7fr]">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-orange-600">Available now</p>
                <h2 className="mt-1 text-xl font-semibold">Menu highlights</h2>
              </div>
              <Link href={`/menu/${slug}/table/1?preview=true`} className="text-sm font-semibold text-emerald-700">Full menu</Link>
            </div>
            {restaurant.menuItems.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {restaurant.menuItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
                    <div
                      className="h-16 w-16 shrink-0 rounded-md bg-zinc-100 bg-cover bg-center"
                      style={item.imageUrl ? { backgroundImage: `url("${item.imageUrl}")` } : undefined}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{item.category}</p>
                      <p className="mt-2 text-sm font-semibold">{formatCurrency(item.offerPrice ?? item.price)} {item.offerPrice != null ? <span className="ml-1 text-xs font-normal text-zinc-400 line-through">{formatCurrency(item.price)}</span> : null}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-zinc-500">This restaurant has not published available menu items yet.</p>}
          </section>

          <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <Badge tone={restaurant.isOpen ? "success" : "neutral"}>{restaurant.isOpen ? "Open now" : "Currently closed"}</Badge>
            <h2 className="mt-4 text-xl font-semibold">Plan your visit</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{restaurant.address}, {restaurant.city}, {restaurant.state}</p>
            <div className={`mt-4 rounded-lg border p-4 ${restaurant.availability.isFull ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}>
              <p className="text-sm font-semibold">{restaurant.availability.isFull ? "No walk-in tables right now" : restaurant.availability.label}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">Live seating can change while you travel. Reserve ahead when booking is available.</p>
            </div>
            {restaurant.bookingEnabled ? <Link href={`/restaurants/${slug}/book`} className="mt-4 block"><Button className="w-full">Check booking times</Button></Link> : null}
          </aside>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

async function getRestaurant(slug: string): Promise<RestaurantDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,state,address,google_maps_url,cover_url,logo_url,rating,is_open")
    .eq("slug", slug).eq("verification_status", "APPROVED").is("deletion_requested_at", null).is("deleted_at", null).single();
  if (error || !data) return null;

  const [settingsResult, availabilityMap, reviewsResult, categoriesResult, itemsResult] = await Promise.all([
    supabase.from("restaurant_settings").select("opening_hours,booking_enabled").eq("restaurant_id", data.id).maybeSingle(),
    getRestaurantAvailabilityMap(supabase, [data.id]),
    supabase.from("reviews").select("id").eq("restaurant_id", data.id),
    supabase.from("categories").select("id,name").eq("restaurant_id", data.id),
    supabase.from("menu_items").select("id,category_id,name,image_url,price,offer_price,is_popular").eq("restaurant_id", data.id).eq("is_available", true).eq("is_sold_out", false).order("is_popular", { ascending: false }).limit(6),
  ]);
  const categories = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));

  return {
    name: data.name,
    slug: data.slug,
    type: data.type,
    cuisine: data.cuisine,
    city: data.city,
    state: data.state,
    address: data.address,
    coverUrl: data.cover_url,
    logoUrl: data.logo_url,
    rating: data.rating == null ? null : Number(data.rating),
    reviewCount: reviewsResult.data?.length ?? 0,
    isOpen: data.is_open,
    openingHours: normalizeOpeningHours(settingsResult.data?.opening_hours ?? null),
    bookingEnabled: settingsResult.data?.booking_enabled ?? false,
    availability: availabilityMap.get(data.id) ?? emptyAvailability(),
    directionsUrl: buildDirectionsUrl({ googleMapsUrl: data.google_maps_url, name: data.name, address: data.address, city: data.city, state: data.state }),
    menuItems: (itemsResult.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      price: Number(item.price),
      offerPrice: item.offer_price == null ? null : Number(item.offer_price),
      category: categories.get(item.category_id) ?? "Menu",
    })),
  };
}

function normalizeOpeningHours(value: Json | null): OpeningHours | null {
  return isRecord(value) && typeof value.open === "string" && typeof value.close === "string" ? { open: value.open, close: value.close } : null;
}

function isRecord(value: Json | null): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatClockTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}
