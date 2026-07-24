import { HomePage } from "@/components/marketing/home-page";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap } from "@/lib/table-availability";

export const revalidate = 300;

export default async function Page() {
  const restaurants = await getRegisteredRestaurants();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flick-order.vercel.app";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FlickOrder",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "In-restaurant QR ordering, menu management, live order operations, UPI payment verification, and restaurant analytics for modern restaurants.",
    offers: [
      { "@type": "Offer", name: "Basic", price: "299", priceCurrency: "INR" },
      { "@type": "Offer", name: "Growth", price: "799", priceCurrency: "INR" },
      { "@type": "Offer", name: "Pro", price: "1499", priceCurrency: "INR" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePage restaurants={restaurants} />
    </>
  );
}

async function getRegisteredRestaurants() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,state,address,is_open")
    .eq("verification_status", "APPROVED")
    .is("deletion_requested_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !data) {
    return [];
  }

  const availabilityByRestaurantId = await getRestaurantAvailabilityMap(supabase, data.map((restaurant) => restaurant.id));

  return data.map((restaurant) => ({
    name: restaurant.name,
    slug: restaurant.slug,
    type: restaurant.type,
    cuisine: restaurant.cuisine,
    city: restaurant.city,
    state: restaurant.state,
    address: restaurant.address,
    is_open: restaurant.is_open,
    availability: availabilityByRestaurantId.get(restaurant.id) ?? emptyAvailability(),
  }));
}
