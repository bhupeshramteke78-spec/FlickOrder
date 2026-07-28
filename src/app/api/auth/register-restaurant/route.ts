import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { extractCoordinatesFromGoogleMapsUrl, normalizeGoogleMapsUrl } from "@/lib/maps";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSupabaseBrowserEnv } from "@/lib/supabase/env";
import { restaurantRegistrationSchema } from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";

const verificationBucket = "restaurant-verification";
const maximumDocumentBytes = 1_258_291;
const allowedDocumentTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, {
    keyPrefix: "register-restaurant",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid registration form." }, { status: 400 });
  }

  const payload = restaurantRegistrationSchema.safeParse({
    ownerName: readText(formData, "ownerName"),
    restaurantName: readText(formData, "restaurantName"),
    restaurantType: readText(formData, "restaurantType"),
    cuisine: readText(formData, "cuisine"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    password: readText(formData, "password"),
    city: readText(formData, "city"),
    state: readText(formData, "state"),
    address: readText(formData, "address"),
    upiId: readText(formData, "upiId"),
    upiDisplayName: readText(formData, "upiDisplayName"),
    fssaiNumber: readText(formData, "fssaiNumber"),
    googleMapsUrl: readText(formData, "googleMapsUrl"),
  });

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid registration details.", details: payload.error.flatten() }, { status: 422 });
  }

  const fssaiCertificate = readFile(formData, "fssaiCertificate");
  const storefrontPhoto = readFile(formData, "storefrontPhoto");
  const businessProof = readFile(formData, "businessProof");
  const fileError =
    validateDocument(fssaiCertificate, "FSSAI certificate", true) ??
    validateDocument(storefrontPhoto, "Storefront photo", true) ??
    validateDocument(businessProof, "Business proof", false);

  if (fileError) {
    return NextResponse.json({ error: fileError }, { status: 422 });
  }

  const input = payload.data;
  let admin: ReturnType<typeof createAdminClient>;
  let authClient: ReturnType<typeof createSupabaseClient>;

  try {
    admin = createAdminClient();
    const { url, anonKey } = assertSupabaseBrowserEnv();
    authClient = createSupabaseClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return NextResponse.json(
      { error: "Supabase server environment variables are not configured." },
      { status: 500 },
    );
  }
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
  const { data: authUser, error: authError } = await authClient.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`,
      data: {
        full_name: input.ownerName,
        role: "OWNER",
      },
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Unable to create owner." }, { status: 400 });
  }

  if (authUser.user.identities?.length === 0) {
    return NextResponse.json({ error: "An account already exists for this email. Sign in instead." }, { status: 409 });
  }

  const ownerId = authUser.user.id;
  const cuisine = input.cuisine
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const slugBase = slugify(input.restaurantName);
  const slug = `${slugBase}-${ownerId.slice(0, 8)}`;
  const coordinates = extractCoordinatesFromGoogleMapsUrl(input.googleMapsUrl);
  const uploadedPaths: string[] = [];

  try {
    const documents = [];

    if (fssaiCertificate) {
      const path = await uploadVerificationDocument(admin, ownerId, "fssai", fssaiCertificate);
      uploadedPaths.push(path);
      documents.push({ document_type: "FSSAI_CERTIFICATE", file_url: path });
    }

    if (storefrontPhoto) {
      const path = await uploadVerificationDocument(admin, ownerId, "storefront", storefrontPhoto);
      uploadedPaths.push(path);
      documents.push({ document_type: "STOREFRONT_PHOTO", file_url: path });
    }

    if (businessProof) {
      const path = await uploadVerificationDocument(admin, ownerId, "business", businessProof);
      uploadedPaths.push(path);
      documents.push({ document_type: "OTHER", file_url: path });
    }

    const { data: restaurant, error: provisioningError } = await admin.rpc("provision_restaurant_owner", {
      p_owner_id: ownerId,
      p_owner_name: input.ownerName,
      p_phone: input.phone,
      p_restaurant_name: input.restaurantName,
      p_slug: slug,
      p_restaurant_type: input.restaurantType,
      p_cuisine: cuisine,
      p_email: input.email,
      p_city: input.city,
      p_state: input.state,
      p_address: input.address,
      p_upi_id: input.upiId,
      p_upi_display_name: input.upiDisplayName,
      p_fssai_number: input.fssaiNumber,
      p_google_maps_url: normalizeGoogleMapsUrl(input.googleMapsUrl),
      p_latitude: coordinates?.latitude ?? null,
      p_longitude: coordinates?.longitude ?? null,
      p_documents: documents,
    });

    if (provisioningError || !restaurant?.[0]) {
      throw provisioningError ?? new Error("Unable to provision restaurant.");
    }

    return NextResponse.json(
      {
        restaurantSlug: restaurant[0].restaurant_slug,
        requiresEmailConfirmation: !authUser.session,
      },
      { status: 201 },
    );
  } catch {
    if (uploadedPaths.length > 0) {
      await admin.storage.from(verificationBucket).remove(uploadedPaths);
    }

    await admin.auth.admin.deleteUser(ownerId);
    return NextResponse.json(
      { error: "Unable to finish restaurant registration. No partial account was kept." },
      { status: 500 },
    );
  }
}

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readFile(formData: FormData, name: string) {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function validateDocument(file: File | null, label: string, required: boolean) {
  if (!file) {
    return required ? `${label} is required.` : null;
  }

  if (!allowedDocumentTypes.has(file.type)) {
    return `${label} must be a PDF, JPEG, PNG, or WebP file.`;
  }

  if (file.size > maximumDocumentBytes) {
    return `${label} must be 1.2 MB or smaller.`;
  }

  return null;
}

async function uploadVerificationDocument(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  kind: string,
  file: File,
) {
  const extension = extensionForMimeType(file.type);
  const path = `${ownerId}/${kind}-${randomUUID()}.${extension}`;
  const { error } = await admin.storage.from(verificationBucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}
