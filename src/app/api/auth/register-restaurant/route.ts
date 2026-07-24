import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { restaurantRegistrationSchema } from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit(request, {
    keyPrefix: "register-restaurant",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = restaurantRegistrationSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid registration details.", details: payload.error.flatten() }, { status: 422 });
  }

  const input = payload.data;
  let supabase: ReturnType<typeof createAdminClient>;

  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Supabase server environment variables are not configured." },
      { status: 500 },
    );
  }
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.ownerName,
      role: "OWNER",
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Unable to create owner." }, { status: 400 });
  }

  const ownerId = authUser.user.id;
  const cuisine = input.cuisine
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const slugBase = slugify(input.restaurantName);
  const slug = `${slugBase}-${ownerId.slice(0, 8)}`;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: ownerId,
    full_name: input.ownerName,
    phone: input.phone,
    role: "OWNER",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
      owner_id: ownerId,
      name: input.restaurantName,
      slug,
      type: input.restaurantType,
      cuisine,
      email: input.email,
      phone: input.phone,
      city: input.city,
      state: input.state,
      address: input.address,
      verification_status: "PENDING",
      fssai_number: input.fssaiNumber,
      google_maps_url: input.googleMapsUrl || null,
    })
    .select("id,slug")
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json({ error: restaurantError?.message ?? "Unable to create restaurant." }, { status: 400 });
  }

  const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { error: memberError } = await supabase.from("restaurant_members").insert({
    restaurant_id: restaurant.id,
    profile_id: ownerId,
    role: "OWNER",
  });

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    restaurant_id: restaurant.id,
    plan: "trial",
    status: "TRIALING",
    trial_ends_at: trialEndsAt,
  });

  const { error: settingsError } = await supabase.from("restaurant_settings").insert({
    restaurant_id: restaurant.id,
    upi_id: input.upiId,
    upi_display_name: input.upiDisplayName,
  });

  const verificationDocuments = [
    input.storefrontPhotoUrl
      ? { restaurant_id: restaurant.id, document_type: "STOREFRONT_PHOTO" as const, file_url: input.storefrontPhotoUrl }
      : null,
    input.businessProofUrl
      ? { restaurant_id: restaurant.id, document_type: "OTHER" as const, file_url: input.businessProofUrl }
      : null,
  ].filter((document): document is NonNullable<typeof document> => Boolean(document));

  const { error: documentsError } =
    verificationDocuments.length > 0
      ? await supabase.from("restaurant_verification_documents").insert(verificationDocuments)
      : { error: null };

  const setupError = memberError ?? subscriptionError ?? settingsError ?? documentsError;

  if (setupError) {
    return NextResponse.json({ error: setupError.message }, { status: 400 });
  }

  return NextResponse.json({ restaurantSlug: restaurant.slug, redirectTo: "/dashboard" }, { status: 201 });
}
