"use client";

import { AlertTriangle, Loader2, MapPinned, Palette, Pencil, Save, Settings2, Store, Trash2, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DefaultFoodTypeFilter = "ALL" | "VEG" | "NON_VEG" | "EGG";

export type SettingsFormState = {
  restaurant: {
    name: string;
    slug: string;
    type: string;
    cuisineText: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    address: string;
    googleMapsUrl: string;
    latitude: string;
    longitude: string;
    locationSource: "OWNER_MANUAL" | "GOOGLE_MAPS_LINK" | "GEOCODED_ADDRESS" | "PIN_PICKER" | null;
    logoUrl: string;
    coverUrl: string;
    isOpen: boolean;
    deletionRequestedAt: string | null;
    deletionReason: string | null;
    deletedAt: string | null;
  };
  settings: {
    brandColor: string;
    upiId: string;
    upiDisplayName: string;
    taxRate: string;
    qrOrderingEnabled: boolean;
    bookingEnabled: boolean;
    bookingSlotMinutes: string;
    bookingDurationMinutes: string;
    bookingAdvanceDays: string;
    bookingMinNoticeMinutes: string;
    bookingMaxPartySize: string;
    openingOpen: string;
    openingClose: string;
    showPopularFirst: boolean;
    showUnavailableItems: boolean;
    defaultFoodTypeFilter: DefaultFoodTypeFilter;
  };
};

export function SettingsForm({
  initialState,
  canEdit,
  canRequestDeletion,
}: {
  initialState: SettingsFormState;
  canEdit: boolean;
  canRequestDeletion: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeletePanelOpen, setIsDeletePanelOpen] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const hasDeletionRequest = Boolean(form.restaurant.deletionRequestedAt);

  function updateRestaurant<T extends keyof SettingsFormState["restaurant"]>(
    key: T,
    value: SettingsFormState["restaurant"][T],
  ) {
    setForm((current) => ({ ...current, restaurant: { ...current.restaurant, [key]: value } }));
  }

  function updateSettings<T extends keyof SettingsFormState["settings"]>(
    key: T,
    value: SettingsFormState["settings"][T],
  ) {
    setForm((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  async function submitSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEditing) {
      toast.info("Click edit settings before making changes.");
      return;
    }

    setIsSaving(true);

    const payload = {
      restaurant: {
        name: form.restaurant.name,
        type: form.restaurant.type,
        cuisine: form.restaurant.cuisineText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        email: form.restaurant.email,
        phone: form.restaurant.phone,
        city: form.restaurant.city,
        state: form.restaurant.state,
        address: form.restaurant.address,
        googleMapsUrl: form.restaurant.googleMapsUrl || null,
        latitude: form.restaurant.latitude ? Number(form.restaurant.latitude) : null,
        longitude: form.restaurant.longitude ? Number(form.restaurant.longitude) : null,
        logoUrl: form.restaurant.logoUrl || null,
        coverUrl: form.restaurant.coverUrl || null,
        isOpen: form.restaurant.isOpen,
      },
      settings: {
        brandColor: form.settings.brandColor,
        upiId: form.settings.upiId,
        upiDisplayName: form.settings.upiDisplayName,
        taxRate: Number(form.settings.taxRate),
        qrOrderingEnabled: form.settings.qrOrderingEnabled,
        bookingEnabled: form.settings.bookingEnabled,
        bookingSlotMinutes: Number(form.settings.bookingSlotMinutes),
        bookingDurationMinutes: Number(form.settings.bookingDurationMinutes),
        bookingAdvanceDays: Number(form.settings.bookingAdvanceDays),
        bookingMinNoticeMinutes: Number(form.settings.bookingMinNoticeMinutes),
        bookingMaxPartySize: Number(form.settings.bookingMaxPartySize),
        openingHours: {
          open: form.settings.openingOpen,
          close: form.settings.openingClose,
        },
        menuPreferences: {
          showPopularFirst: form.settings.showPopularFirst,
          showUnavailableItems: form.settings.showUnavailableItems,
          defaultFoodTypeFilter: form.settings.defaultFoodTypeFilter,
        },
      },
    };

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSaving(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to save settings.");
      return;
    }

    toast.success("Settings saved.");
    setIsEditing(false);
    router.refresh();
  }

  async function requestDeletion() {
    if (deleteName.trim() !== form.restaurant.name) {
      toast.error("Type the restaurant name exactly before requesting deletion.");
      return;
    }

    setIsRequestingDeletion(true);

    const response = await fetch("/api/settings/delete-restaurant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantName: deleteName.trim(),
        reason: deleteReason.trim() || undefined,
      }),
    });

    setIsRequestingDeletion(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to request account deletion.");
      return;
    }

    toast.success("Deletion request sent to FlickOrder super admin.");
    setDeleteName("");
    setDeleteReason("");
    router.refresh();
  }

  return (
    <form onSubmit={submitSettings} className="grid gap-5">
      <Card className="overflow-hidden p-0">
        <div
          className="p-6 text-white"
          style={{ background: `linear-gradient(135deg, #071117 0%, ${form.settings.brandColor} 160%)` }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">Restaurant Control</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">{form.restaurant.name || "Restaurant Name"}</h2>
              <p className="mt-2 text-sm text-white/70">Guest-facing restaurant details stay connected to this profile.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="glass"
                disabled={!canEdit}
                onClick={() => setIsEditing((current) => !current)}
              >
                <Pencil className="h-4 w-4" />
                {isEditing ? "Lock editing" : "Edit settings"}
              </Button>
              <Button type="submit" disabled={!isEditing || isSaving} variant="glass">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SettingsSection
          icon={Store}
          title="Restaurant profile"
            description="Control what guests see on discovery pages, QR menus, and restaurant detail screens."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Restaurant name">
              <Input disabled={!isEditing} required value={form.restaurant.name} onChange={(event) => updateRestaurant("name", event.target.value)} />
            </Field>
            <Field label="Restaurant type">
              <Input disabled={!isEditing} required value={form.restaurant.type} onChange={(event) => updateRestaurant("type", event.target.value)} placeholder="Cafe, Fine Dining, Family Restaurant" />
            </Field>
            <Field label="Cuisine">
              <Input disabled={!isEditing} required value={form.restaurant.cuisineText} onChange={(event) => updateRestaurant("cuisineText", event.target.value)} placeholder="Indian, Italian, Chinese" />
            </Field>
            <Field label="Phone">
              <Input disabled={!isEditing} required value={isEditing ? form.restaurant.phone : maskPhone(form.restaurant.phone)} onChange={(event) => updateRestaurant("phone", event.target.value)} />
            </Field>
            <Field label="Email">
              <Input disabled={!isEditing} required type={isEditing ? "email" : "text"} value={isEditing ? form.restaurant.email : maskEmail(form.restaurant.email)} onChange={(event) => updateRestaurant("email", event.target.value)} />
            </Field>
            <Field label="City">
              <Input disabled={!isEditing} required value={form.restaurant.city} onChange={(event) => updateRestaurant("city", event.target.value)} />
            </Field>
            <Field label="State">
              <Input disabled={!isEditing} required value={form.restaurant.state} onChange={(event) => updateRestaurant("state", event.target.value)} />
            </Field>
            <Field label="Open status">
              <ToggleLabel
                disabled={!isEditing}
                checked={form.restaurant.isOpen}
                label={form.restaurant.isOpen ? "Open now" : "Closed"}
                onChange={(checked) => updateRestaurant("isOpen", checked)}
              />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <textarea
                disabled={!isEditing}
                required
                className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
                value={form.restaurant.address}
                onChange={(event) => updateRestaurant("address", event.target.value)}
              />
            </Field>
            <Field label="Google Maps location link" className="md:col-span-2">
              <Input
                disabled={!isEditing}
                value={form.restaurant.googleMapsUrl}
                onChange={(event) => updateRestaurant("googleMapsUrl", event.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
              <span className="mt-1 block text-xs text-zinc-500">
                Customers use this for directions, and FlickOrder uses it during restaurant verification.
              </span>
            </Field>
            <div className="md:col-span-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-950">Nearby search coordinates</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Add the restaurant&apos;s real latitude and longitude so customers can find nearby restaurants accurately. Full Google Maps links with embedded coordinates are detected automatically, but short links may need manual values.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Latitude">
                    <Input
                      disabled={!isEditing}
                      type="number"
                      min={-90}
                      max={90}
                      step="0.0000001"
                      value={form.restaurant.latitude}
                      onChange={(event) => updateRestaurant("latitude", event.target.value)}
                      placeholder="21.1458000"
                    />
                  </Field>
                  <Field label="Longitude">
                    <Input
                      disabled={!isEditing}
                      type="number"
                      min={-180}
                      max={180}
                      step="0.0000001"
                      value={form.restaurant.longitude}
                      onChange={(event) => updateRestaurant("longitude", event.target.value)}
                      placeholder="79.0882000"
                    />
                  </Field>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Location source: {formatLocationSource(form.restaurant.locationSource)}
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={WalletCards}
          title="Payments and taxes"
          description="UPI details are used to generate customer payment links. Payment status still needs restaurant verification."
        >
          <div className="grid gap-4">
            <Field label="UPI ID">
              <Input disabled={!isEditing} required value={isEditing ? form.settings.upiId : maskUpi(form.settings.upiId)} onChange={(event) => updateSettings("upiId", event.target.value)} placeholder="restaurant@oksbi" />
            </Field>
            <Field label="UPI display name">
              <Input disabled={!isEditing} required value={form.settings.upiDisplayName} onChange={(event) => updateSettings("upiDisplayName", event.target.value)} />
            </Field>
            <Field label="Tax rate (%)">
              <Input disabled={!isEditing} required min={0} max={50} step="0.01" type="number" value={form.settings.taxRate} onChange={(event) => updateSettings("taxRate", event.target.value)} />
            </Field>
          </div>
        </SettingsSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection
          icon={Palette}
          title="Brand and media"
          description="Use hosted image URLs from Supabase Storage or your CDN for logo and cover media."
        >
          <div className="grid gap-4">
            <Field label="Brand color">
              <div className="grid grid-cols-[56px_1fr] gap-3">
                <input
                  disabled={!isEditing}
                  type="color"
                  value={form.settings.brandColor}
                  onChange={(event) => updateSettings("brandColor", event.target.value)}
                  className="h-11 w-14 rounded-lg border border-zinc-200 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Brand color"
                />
                <Input disabled={!isEditing} required value={form.settings.brandColor} onChange={(event) => updateSettings("brandColor", event.target.value)} />
              </div>
            </Field>
            <Field label="Logo URL">
              <Input disabled={!isEditing} value={form.restaurant.logoUrl} onChange={(event) => updateRestaurant("logoUrl", event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Cover URL">
              <Input disabled={!isEditing} value={form.restaurant.coverUrl} onChange={(event) => updateRestaurant("coverUrl", event.target.value)} placeholder="https://..." />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Settings2}
          title="QR ordering and menu"
          description="Set operating hours and how the customer menu should behave."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Opening time">
              <Input disabled={!isEditing} required type="time" value={form.settings.openingOpen} onChange={(event) => updateSettings("openingOpen", event.target.value)} />
            </Field>
            <Field label="Closing time">
              <Input disabled={!isEditing} required type="time" value={form.settings.openingClose} onChange={(event) => updateSettings("openingClose", event.target.value)} />
            </Field>
            <Field label="QR ordering" className="md:col-span-2">
              <ToggleLabel
                disabled={!isEditing}
                checked={form.settings.qrOrderingEnabled}
                label={form.settings.qrOrderingEnabled ? "Enabled" : "Disabled"}
                onChange={(checked) => updateSettings("qrOrderingEnabled", checked)}
              />
            </Field>
            <Field label="Online table booking" className="md:col-span-2">
              <ToggleLabel
                disabled={!isEditing}
                checked={form.settings.bookingEnabled}
                label={form.settings.bookingEnabled ? "Accepting online bookings" : "Online booking disabled"}
                onChange={(checked) => updateSettings("bookingEnabled", checked)}
              />
            </Field>
            <Field label="Booking slot interval">
              <select
                disabled={!isEditing}
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm disabled:bg-zinc-50"
                value={form.settings.bookingSlotMinutes}
                onChange={(event) => updateSettings("bookingSlotMinutes", event.target.value)}
              >
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every 60 minutes</option>
              </select>
            </Field>
            <Field label="Expected table duration">
              <Input disabled={!isEditing} type="number" min={30} max={360} step={15} value={form.settings.bookingDurationMinutes} onChange={(event) => updateSettings("bookingDurationMinutes", event.target.value)} />
            </Field>
            <Field label="Advance booking window (days)">
              <Input disabled={!isEditing} type="number" min={1} max={180} value={form.settings.bookingAdvanceDays} onChange={(event) => updateSettings("bookingAdvanceDays", event.target.value)} />
            </Field>
            <Field label="Minimum notice (minutes)">
              <Input disabled={!isEditing} type="number" min={0} max={1440} step={15} value={form.settings.bookingMinNoticeMinutes} onChange={(event) => updateSettings("bookingMinNoticeMinutes", event.target.value)} />
            </Field>
            <Field label="Maximum online party size">
              <Input disabled={!isEditing} type="number" min={1} max={100} value={form.settings.bookingMaxPartySize} onChange={(event) => updateSettings("bookingMaxPartySize", event.target.value)} />
            </Field>
            <Field label="Default food filter">
              <select
                disabled={!isEditing}
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
                value={form.settings.defaultFoodTypeFilter}
                onChange={(event) => updateSettings("defaultFoodTypeFilter", event.target.value as DefaultFoodTypeFilter)}
              >
                <option value="ALL">All</option>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-veg</option>
                <option value="EGG">Egg</option>
              </select>
            </Field>
            <Field label="Menu display">
              <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <ToggleLabel
                  disabled={!isEditing}
                  checked={form.settings.showPopularFirst}
                  label="Show popular first"
                  onChange={(checked) => updateSettings("showPopularFirst", checked)}
                />
                <ToggleLabel
                  disabled={!isEditing}
                  checked={form.settings.showUnavailableItems}
                  label="Show unavailable items"
                  onChange={(checked) => updateSettings("showUnavailableItems", checked)}
                />
              </div>
            </Field>
          </div>
        </SettingsSection>
      </div>

      <Card className="border-rose-200 bg-rose-50/60">
        <CardHeader>
          <div>
            <CardTitle>Account Delete</CardTitle>
            <CardDescription>
              Request restaurant account deletion. FlickOrder hides the restaurant and pauses QR ordering immediately, then super admin reviews the request.
            </CardDescription>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </CardHeader>

        {hasDeletionRequest ? (
          <div className="rounded-lg border border-rose-200 bg-white p-4 text-sm">
            <p className="font-semibold text-rose-700">Deletion requested</p>
            <p className="mt-1 text-zinc-600">
              Requested on {formatDate(form.restaurant.deletionRequestedAt)}. Customer discovery, QR menus, and operations are paused until super admin review.
            </p>
            {form.restaurant.deletionReason ? <p className="mt-2 text-zinc-500">Reason: {form.restaurant.deletionReason}</p> : null}
          </div>
        ) : isDeletePanelOpen ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Field label="Type restaurant name">
              <Input
                disabled={!canRequestDeletion || isRequestingDeletion}
                value={deleteName}
                onChange={(event) => setDeleteName(event.target.value)}
                placeholder={form.restaurant.name}
              />
            </Field>
            <Field label="Reason (optional)">
              <Input
                disabled={!canRequestDeletion || isRequestingDeletion}
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Closing, switching system, duplicate account..."
              />
            </Field>
            <Button
              type="button"
              variant="danger"
              disabled={!canRequestDeletion || isRequestingDeletion || deleteName.trim() !== form.restaurant.name}
              onClick={requestDeletion}
            >
              {isRequestingDeletion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Request deletion
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isRequestingDeletion}
              onClick={() => {
                setIsDeletePanelOpen(false);
                setDeleteName("");
                setDeleteReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">
              Open this only if the restaurant wants FlickOrder to review account deletion.
            </p>
            <Button
              type="button"
              variant="danger"
              disabled={!canRequestDeletion}
              onClick={() => setIsDeletePanelOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        )}
      </Card>
    </form>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function maskEmail(value: string) {
  const [name, domain] = value.split("@");

  if (!name || !domain) {
    return value ? "••••••" : "";
  }

  return `${name.slice(0, 2)}••••@${domain}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 4) {
    return value ? "••••" : "";
  }

  return `••••••${digits.slice(-4)}`;
}

function maskUpi(value: string) {
  const [name, provider] = value.split("@");

  if (!name || !provider) {
    return value ? "••••••" : "";
  }

  return `${name.slice(0, 3)}••••@${provider}`;
}

function formatLocationSource(value: SettingsFormState["restaurant"]["locationSource"]) {
  if (value === "GOOGLE_MAPS_LINK") {
    return "Google Maps link";
  }

  if (value === "OWNER_MANUAL") {
    return "Manual coordinates";
  }

  if (value === "PIN_PICKER") {
    return "Map pin";
  }

  if (value === "GEOCODED_ADDRESS") {
    return "Address geocoding";
  }

  return "Not set";
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Store;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function ToggleLabel({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex h-11 items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:hover:border-zinc-200"
      aria-pressed={checked}
    >
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
