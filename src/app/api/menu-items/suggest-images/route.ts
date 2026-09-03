import { NextResponse } from "next/server";
import { getMatchingFoodImages, type FoodImageSuggestion } from "@/lib/food-images";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";

  const dbSuggestions: FoodImageSuggestion[] = [];

  // Fetch adaptive photos from existing restaurant database
  if (isSupabaseConfigured() && query.length >= 2) {
    try {
      const supabase = createAdminClient();

      // Query database for dishes with matching names that have photos
      const { data: dbItems } = await supabase
        .from("menu_items")
        .select("id,name,image_url")
        .ilike("name", `%${query}%`)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      const seenUrls = new Set<string>();

      for (const item of dbItems ?? []) {
        if (item.image_url && item.image_url.trim() && !seenUrls.has(item.image_url)) {
          seenUrls.add(item.image_url);
          dbSuggestions.push({
            id: `db-${item.id}`,
            url: item.image_url,
            thumbnailUrl: item.image_url,
            title: item.name,
            source: "FlickOrder Restaurant Network",
          });
        }
      }
    } catch {
      // Graceful fallback to curated library
    }
  }

  // Curated Indian food catalog as fallback / supplement
  const fallbackSuggestions = getMatchingFoodImages(query, category);

  // Combine: prioritize database images first
  const combinedSuggestions: FoodImageSuggestion[] = [];
  const addedUrls = new Set<string>();

  for (const s of [...dbSuggestions, ...fallbackSuggestions]) {
    if (!addedUrls.has(s.url)) {
      addedUrls.add(s.url);
      combinedSuggestions.push(s);
    }
  }

  return NextResponse.json({
    suggestions: combinedSuggestions.slice(0, 4),
    hasDatabaseMatch: dbSuggestions.length > 0,
  });
}
