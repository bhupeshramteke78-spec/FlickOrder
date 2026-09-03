import { Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SettingsForm, type SettingsFormState } from "@/components/dashboard/settings/settings-form";
import { StaffAccessManager } from "@/components/dashboard/settings/staff-access-manager";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { EmptyState } from "@/components/ui/empty-state";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import type { Json } from "@/lib/database.types";
import { hasPermission } from "@/lib/permissions";
import { getRestaurantStaffPinsDetails } from "@/lib/staff-auth";
import { getSubscriptionAccessForCurrentUser } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type OpeningHours = {
  open: string;
  close: string;
};

type MenuPreferences = {
  showPopularFirst: boolean;
  showUnavailableItems: boolean;
  defaultFoodTypeFilter: "ALL" | "VEG" | "NON_VEG" | "EGG";
};

export default async function SettingsPage() {
  const { access, role, restaurantId } = await getSettingsAccess();
  const canViewSettings = hasPermission(role, "viewSettings");
  const canEditSettings = hasPermission(role, "manageSettings");
  const initialState = canViewSettings ? await getSettingsState() : null;
  const staffPins = restaurantId && canViewSettings ? await getStaffPinsData(restaurantId) : null;

  return (
    <DashboardShell title="Settings" eyebrow="Restaurant configuration">
      {!canViewSettings ? (
        <PermissionLock description="Only owners and managers can view restaurant settings." />
      ) : (
      <div className="space-y-6">
        <SubscriptionLock access={access} />
        {initialState ? (
          <>
            <SettingsForm
              initialState={initialState}
              canEdit={(access?.canManageRestaurant ?? false) && canEditSettings}
              canRequestDeletion={role === "OWNER" && !initialState.restaurant.deletedAt}
            />

            {staffPins && restaurantId && initialState.restaurant.slug && access?.canUseStaffWorkflow ? (
              <StaffAccessManager
                restaurantId={restaurantId}
                restaurantSlug={initialState.restaurant.slug}
                initialPins={staffPins.pins}
                lastResetTimestamp={staffPins.lastResetTimestamp}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Settings}
            title="Settings not available"
            description="Complete restaurant registration first. Once a restaurant and settings row exist, profile, payment, QR ordering, and menu preferences can be edited here."
          />
        )}
      </div>
      )}
    </DashboardShell>
  );
}

async function getStaffPinsData(restaurantId: string) {
  const supabase = await createClient();
  return getRestaurantStaffPinsDetails(supabase, restaurantId);
}

async function getSettingsAccess() {
  if (!isSupabaseConfigured()) {
    return { access: null, role: null, restaurantId: null };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);
  const context = await getSelectedDashboardRestaurant(supabase);

  return {
    access,
    role: membership?.role ?? null,
    restaurantId: context?.selected.restaurantId ?? null,
  };
}

async function getSettingsState(): Promise<SettingsFormState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context || !hasPermission(context.selected.memberRole, "viewSettings")) {
    return null;
  }

  const [{ data: restaurant }, { data: settings }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("name,slug,type,cuisine,email,phone,city,state,address,google_maps_url,latitude,longitude,location_source,logo_url,cover_url,is_open,deletion_requested_at,deletion_reason,deleted_at")
      .eq("id", context.selected.restaurantId)
      .single(),
    supabase
      .from("restaurant_settings")
      .select("brand_color,upi_id,upi_display_name,tax_rate,qr_ordering_enabled,opening_hours,menu_preferences,booking_enabled,booking_slot_minutes,booking_duration_minutes,booking_advance_days,booking_min_notice_minutes,booking_max_party_size")
      .eq("restaurant_id", context.selected.restaurantId)
      .maybeSingle(),
  ]);

  if (!restaurant || !settings) {
    return null;
  }

  const openingHours = normalizeOpeningHours(settings.opening_hours);
  const menuPreferences = normalizeMenuPreferences(settings.menu_preferences);

  return {
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      type: restaurant.type,
      cuisineText: restaurant.cuisine.join(", "),
      email: restaurant.email,
      phone: restaurant.phone,
      city: restaurant.city,
      state: restaurant.state,
      address: restaurant.address,
      googleMapsUrl: restaurant.google_maps_url ?? "",
      latitude: restaurant.latitude == null ? "" : String(restaurant.latitude),
      longitude: restaurant.longitude == null ? "" : String(restaurant.longitude),
      locationSource: restaurant.location_source,
      logoUrl: restaurant.logo_url ?? "",
      coverUrl: restaurant.cover_url ?? "",
      isOpen: restaurant.is_open,
      deletionRequestedAt: restaurant.deletion_requested_at,
      deletionReason: restaurant.deletion_reason,
      deletedAt: restaurant.deleted_at,
    },
    settings: {
      brandColor: settings.brand_color,
      upiId: settings.upi_id,
      upiDisplayName: settings.upi_display_name,
      taxRate: String(settings.tax_rate),
      qrOrderingEnabled: settings.qr_ordering_enabled,
      bookingEnabled: settings.booking_enabled,
      bookingSlotMinutes: String(settings.booking_slot_minutes),
      bookingDurationMinutes: String(settings.booking_duration_minutes),
      bookingAdvanceDays: String(settings.booking_advance_days),
      bookingMinNoticeMinutes: String(settings.booking_min_notice_minutes),
      bookingMaxPartySize: String(settings.booking_max_party_size),
      openingOpen: openingHours.open,
      openingClose: openingHours.close,
      showPopularFirst: menuPreferences.showPopularFirst,
      showUnavailableItems: menuPreferences.showUnavailableItems,
      defaultFoodTypeFilter: menuPreferences.defaultFoodTypeFilter,
    },
  };
}

function normalizeOpeningHours(value: Json): OpeningHours {
  if (isRecord(value) && typeof value.open === "string" && typeof value.close === "string") {
    return { open: value.open, close: value.close };
  }

  return { open: "11:00", close: "23:00" };
}

function normalizeMenuPreferences(value: Json): MenuPreferences {
  const fallback: MenuPreferences = {
    showPopularFirst: true,
    showUnavailableItems: false,
    defaultFoodTypeFilter: "ALL",
  };

  if (!isRecord(value)) {
    return fallback;
  }

  const defaultFoodTypeFilter =
    value.defaultFoodTypeFilter === "VEG" ||
    value.defaultFoodTypeFilter === "NON_VEG" ||
    value.defaultFoodTypeFilter === "EGG" ||
    value.defaultFoodTypeFilter === "ALL"
      ? value.defaultFoodTypeFilter
      : fallback.defaultFoodTypeFilter;

  return {
    showPopularFirst: typeof value.showPopularFirst === "boolean" ? value.showPopularFirst : fallback.showPopularFirst,
    showUnavailableItems:
      typeof value.showUnavailableItems === "boolean" ? value.showUnavailableItems : fallback.showUnavailableItems,
    defaultFoodTypeFilter,
  };
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
