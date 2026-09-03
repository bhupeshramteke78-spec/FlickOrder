import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bucketName = "menu-items";
const maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return NextResponse.json({ error: "Restaurant context not found." }, { status: 401 });
  }

  if (!hasPermission(context.selected.memberRole, "manageMenu")) {
    return NextResponse.json({ error: "Only owners and managers can upload menu photos." }, { status: 403 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A valid image file is required." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are supported." }, { status: 422 });
  }

  if (file.size > maxFileSizeBytes) {
    return NextResponse.json({ error: "Image file size must be 5 MB or smaller." }, { status: 422 });
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const filePath = `${context.selected.restaurantId}/${randomUUID()}.${extension}`;

  const admin = createAdminClient();

  // Ensure bucket exists in storage
  const { data: buckets } = await admin.storage.listBuckets();
  const bucketExists = (buckets ?? []).some((b) => b.id === bucketName);

  if (!bucketExists) {
    await admin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: maxFileSizeBytes,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message ?? "Unable to upload image." }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage.from(bucketName).getPublicUrl(filePath);

  return NextResponse.json({ imageUrl: publicUrlData.publicUrl }, { status: 201 });
}
