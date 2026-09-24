import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink, MapPin, Star, Table2, Utensils } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
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
  availability: RestaurantAvailability;
  directionsUrl: string;
  menuItems: MenuPreviewItem[];
};

export default async function RestaurantDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);
  if (!restaurant) notFound();

  return (
    <main className="min-h-screen bg-[#071117] text-white selection:bg-orange-500/30">
      {/* Top Header with Seamless Horizon Sunset Glow */}
      <div className="relative overflow-hidden">
        <div 
          className="pointer-events-none absolute inset-x-0 -top-32 h-[600px] opacity-90"
          style={{
            background: "radial-gradient(ellipse 90% 65% at 50% -5%, rgba(249, 115, 22, 0.45), rgba(239, 68, 68, 0.25) 50%, rgba(7, 17, 23, 0) 90%)",
          }}
          aria-hidden="true"
        />
        <div 
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[100px] opacity-35 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600"
          aria-hidden="true"
        />

        <MarketingNav />

        <section className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
          <Link href="/restaurants/search" className="mb-6 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-orange-300 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to Explore Restaurants
          </Link>

          {/* Restaurant Banner Card */}
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0c1822]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div
              className="relative min-h-64 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent bg-cover bg-center sm:min-h-80"
              style={restaurant.coverUrl ? { backgroundImage: `linear-gradient(0deg, #0c1822 0%, rgba(7,17,23,0.5) 60%, transparent 100%), url("${restaurant.coverUrl}")` } : undefined}
            >
              {!restaurant.coverUrl ? <div className="restaurant-photo absolute inset-0" /> : null}
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-5 p-6 sm:p-8 text-white">
                {restaurant.logoUrl ? (
                  <div 
                    className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl border-2 border-white/20 bg-[#071117] bg-contain bg-center bg-no-repeat shadow-2xl" 
                    style={{ backgroundImage: `url("${restaurant.logoUrl}")` }} 
                  />
                ) : null}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">{restaurant.name}</h1>
                  <p className="mt-1.5 text-sm sm:text-base text-zinc-300">{restaurant.cuisine.join(", ") || restaurant.type}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center border-t border-white/[0.08]">
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm text-zinc-300">
                {restaurant.rating != null ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 font-bold text-amber-300">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {restaurant.rating.toFixed(1)} · {restaurant.reviewCount} reviews
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-zinc-300">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  {restaurant.city}, {restaurant.state}
                </span>
                {restaurant.openingHours ? (
                  <span className="inline-flex items-center gap-1.5 text-zinc-300">
                    <Clock className="h-4 w-4 text-amber-400" />
                    {restaurant.isOpen ? `Closes ${formatClockTime(restaurant.openingHours.close)}` : `Opens ${formatClockTime(restaurant.openingHours.open)}`}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Table2 className="h-4 w-4" />
                  {restaurant.availability.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={restaurant.directionsUrl} target="_blank" rel="noreferrer">
                  <Button variant="glass" className="rounded-xl border-white/15 bg-white/[0.06] text-white hover:bg-white/10 text-xs sm:text-sm">
                    <ExternalLink className="h-4 w-4 mr-1.5 text-orange-400" /> Directions
                  </Button>
                </a>
                <Link href={`/menu/${slug}/table/1?preview=true`}>
                  <Button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs sm:text-sm px-5 shadow-md shadow-orange-500/25 hover:opacity-95">
                    <Utensils className="h-4 w-4 mr-1.5" /> View Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
            {/* Menu Highlights */}
            <section className="rounded-[32px] border border-white/10 bg-[#0c1822]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
                    <span>Available Now</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-white">Menu Highlights</h2>
                </div>
                <Link href={`/menu/${slug}/table/1?preview=true`} className="text-xs sm:text-sm font-bold text-orange-300 hover:text-white transition">
                  Full Menu →
                </Link>
              </div>
              {restaurant.menuItems.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {restaurant.menuItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 hover:border-orange-500/40 hover:bg-white/[0.06] transition">
                      <div
                        className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 bg-cover bg-center"
                        style={item.imageUrl ? { backgroundImage: `url("${item.imageUrl}")` } : undefined}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{item.name}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{item.category}</p>
                        <p className="mt-1.5 text-sm font-bold text-amber-300">
                          {formatCurrency(item.offerPrice ?? item.price)}{" "}
                          {item.offerPrice != null ? (
                            <span className="ml-1 text-xs font-normal text-zinc-500 line-through">
                              {formatCurrency(item.price)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-zinc-400">This restaurant has not published available menu items yet.</p>
              )}
            </section>

            {/* Plan your visit */}
            <aside className="rounded-[32px] border border-white/10 bg-[#0c1822]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <Badge tone={restaurant.isOpen ? "success" : "neutral"} className="px-3 py-1 text-xs font-bold">
                {restaurant.isOpen ? "Open Now" : "Currently Closed"}
              </Badge>
              <h2 className="mt-4 text-2xl font-black text-white">Plan Your Visit</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{restaurant.address}, {restaurant.city}, {restaurant.state}</p>
              <div className={`mt-6 rounded-2xl border p-4.5 ${
                restaurant.availability.isFull 
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300" 
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}>
                <p className="text-sm font-bold">{restaurant.availability.isFull ? "No walk-in tables right now" : restaurant.availability.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">Live seating updates in real-time. Scan the table QR code upon arrival to place orders.</p>
              </div>
            </aside>
          </div>
        </section>
      </div>
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
    supabase.from("restaurant_settings").select("opening_hours").eq("restaurant_id", data.id).maybeSingle(),
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
