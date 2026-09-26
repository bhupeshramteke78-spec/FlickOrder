"use client";

import { AlertTriangle, Loader2, MapPinned, Pencil, Save, Settings2, Store, Trash2, WalletCards, X } from "lucide-react";
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
      toast.info("Click Edit Settings before saving changes.");
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
      toast.error(body?.error ?? "Unable to update restaurant settings.");
      return;
    }

    toast.success("Restaurant settings updated successfully.");
    setIsEditing(false);
    router.refresh();
  }

  async function requestDeletion() {
    if (deleteName.trim() !== form.restaurant.name) {
      toast.error("Restaurant name did not match.");
      return;
    }

    setIsRequestingDeletion(true);

    const response = await fetch("/api/restaurants/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: deleteReason }),
    });

    setIsRequestingDeletion(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to request restaurant deletion.");
      return;
    }

    toast.success("Account deletion requested. Operations are paused pending review.");
    setIsDeletePanelOpen(false);
    router.refresh();
  }

  return (
    <form onSubmit={submitSettings} className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-bold text-zinc-950">Restaurant Configuration</p>
          <p className="text-xs text-zinc-500">Update outlet profile, location, UPI settlements, and dining rules.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setForm(initialState);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="gap-1.5 text-xs rounded-xl"
              >
                <X className="h-3.5 w-3.5" /> Discard
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-600/20"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={!canEdit}
              onClick={() => setIsEditing(true)}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-600/20"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Settings
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Store Information */}
        <SettingsSection
          icon={Store}
          title="Restaurant Details"
          description="Name, cuisines, and primary guest contact numbers."
        >
          <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2">
            <Field label="Restaurant name" className="sm:col-span-2">
              <Input
                disabled={!isEditing}
                value={form.restaurant.name}
                onChange={(event) => updateRestaurant("name", event.target.value)}
                placeholder="Tasty Bites"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Cuisines (comma-separated)" className="sm:col-span-2">
              <Input
                disabled={!isEditing}
                value={form.restaurant.cuisineText}
                onChange={(event) => updateRestaurant("cuisineText", event.target.value)}
                placeholder="North Indian, Mughlai, Biryani"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Restaurant type">
              <Input
                disabled={!isEditing}
                value={form.restaurant.type}
                onChange={(event) => updateRestaurant("type", event.target.value)}
                placeholder="Dine-in / Cafe"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Operating status">
              <div className="flex h-10 items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3">
                <span className="text-xs font-bold text-zinc-700">
                  {form.restaurant.isOpen ? "● Open for Dining" : "○ Closed"}
                </span>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => updateRestaurant("isOpen", !form.restaurant.isOpen)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    form.restaurant.isOpen ? "bg-emerald-600" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                      form.restaurant.isOpen ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </Field>

            <Field label="Contact email">
              <Input
                disabled={!isEditing}
                value={form.restaurant.email}
                onChange={(event) => updateRestaurant("email", event.target.value)}
                placeholder="contact@restaurant.com"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Contact phone">
              <Input
                disabled={!isEditing}
                value={form.restaurant.phone}
                onChange={(event) => updateRestaurant("phone", event.target.value)}
                placeholder="+91 98765 43210"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="City">
              <Input
                disabled={!isEditing}
                value={form.restaurant.city}
                onChange={(event) => updateRestaurant("city", event.target.value)}
                placeholder="Mumbai"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="State">
              <Input
                disabled={!isEditing}
                value={form.restaurant.state}
                onChange={(event) => updateRestaurant("state", event.target.value)}
                placeholder="Maharashtra"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Full street address" className="sm:col-span-2">
              <Input
                disabled={!isEditing}
                value={form.restaurant.address}
                onChange={(event) => updateRestaurant("address", event.target.value)}
                placeholder="Shop 4, Ground Floor, Linking Road, Bandra West"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>
          </div>
        </SettingsSection>

        {/* Section 2: Location & Maps */}
        <SettingsSection
          icon={MapPinned}
          title="Location & Maps"
          description="Google Maps integration for customer discovery."
        >
          <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2">
            <Field label="Google Maps link" className="sm:col-span-2">
              <Input
                disabled={!isEditing}
                value={form.restaurant.googleMapsUrl}
                onChange={(event) => updateRestaurant("googleMapsUrl", event.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Latitude">
              <Input
                disabled={!isEditing}
                value={form.restaurant.latitude}
                onChange={(event) => updateRestaurant("latitude", event.target.value)}
                placeholder="19.0760"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Longitude">
              <Input
                disabled={!isEditing}
                value={form.restaurant.longitude}
                onChange={(event) => updateRestaurant("longitude", event.target.value)}
                placeholder="72.8777"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <div className="sm:col-span-2 rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 text-xs text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-900">Map Source: {formatLocationSource(form.restaurant.locationSource)}</p>
              <p className="text-zinc-500 leading-relaxed">
                Paste your Google Maps link or coordinates. Customers can navigate directly to your restaurant from the QR menu footer.
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Section 3: Branding & Payment */}
        <SettingsSection
          icon={WalletCards}
          title="Payment & UPI Settlements"
          description="Configure direct UPI IDs and GST billing rates."
        >
          <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2">
            <Field label="UPI ID (VPA)">
              <Input
                disabled={!isEditing}
                value={form.settings.upiId}
                onChange={(event) => updateSettings("upiId", event.target.value)}
                placeholder="restaurant@okhdfcbank"
                className="focus:ring-rose-500/20 focus:border-rose-500 font-mono text-xs"
              />
            </Field>

            <Field label="UPI Merchant Name">
              <Input
                disabled={!isEditing}
                value={form.settings.upiDisplayName}
                onChange={(event) => updateSettings("upiDisplayName", event.target.value)}
                placeholder="Tasty Bites Foods Pvt Ltd"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="GST / Tax Rate (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="28"
                disabled={!isEditing}
                value={form.settings.taxRate}
                onChange={(event) => updateSettings("taxRate", event.target.value)}
                placeholder="5"
                className="focus:ring-rose-500/20 focus:border-rose-500"
              />
            </Field>

            <Field label="Brand Accent Color">
              <div className="flex gap-2">
                <input
                  type="color"
                  disabled={!isEditing}
                  value={form.settings.brandColor || "#f43f5e"}
                  onChange={(event) => updateSettings("brandColor", event.target.value)}
                  className="h-10 w-12 rounded-xl border border-zinc-200 cursor-pointer p-0.5 bg-white disabled:opacity-50"
                />
                <Input
                  disabled={!isEditing}
                  value={form.settings.brandColor}
                  onChange={(event) => updateSettings("brandColor", event.target.value)}
                  placeholder="#f43f5e"
                  className="flex-1 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-xs"
                />
              </div>
            </Field>
          </div>
        </SettingsSection>

        {/* Section 4: System Preferences */}
        <SettingsSection
          icon={Settings2}
          title="Dining & QR Preferences"
          description="Customer ordering controls and menu filtering options."
        >
          <div className="space-y-4 p-6 pt-0">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
              <div>
                <p className="text-xs font-bold text-zinc-900">QR Table Ordering</p>
                <p className="text-[11px] text-zinc-500">Allow guests to place orders directly from QR scan.</p>
              </div>
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => updateSettings("qrOrderingEnabled", !form.settings.qrOrderingEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  form.settings.qrOrderingEnabled ? "bg-rose-600" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    form.settings.qrOrderingEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <Field label="Default Food Filter on QR Menu">
              <select
                disabled={!isEditing}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:bg-zinc-50 disabled:text-zinc-500"
                value={form.settings.defaultFoodTypeFilter}
                onChange={(event) => updateSettings("defaultFoodTypeFilter", event.target.value as DefaultFoodTypeFilter)}
              >
                <option value="ALL">All Items (Veg, Non-Veg & Egg)</option>
                <option value="VEG">Pure Veg First</option>
                <option value="NON_VEG">Non-Veg First</option>
                <option value="EGG">Egg Items Included</option>
              </select>
            </Field>

            <div className="grid gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
              <label className="flex items-center justify-between text-xs font-semibold text-zinc-700 cursor-pointer">
                <span>Show Popular items first</span>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={form.settings.showPopularFirst}
                  onChange={(e) => updateSettings("showPopularFirst", e.target.checked)}
                  className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-zinc-700 cursor-pointer border-t border-zinc-200/60 pt-2.5">
                <span>Show unavailable items (marked sold out)</span>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={form.settings.showUnavailableItems}
                  onChange={(e) => updateSettings("showUnavailableItems", e.target.checked)}
                  className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
                />
              </label>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Section 5: Account Delete Card */}
      <Card className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Account Deletion
            </h3>
            <p className="mt-1 text-xs text-rose-800 leading-relaxed">
              Request restaurant account deletion. This pauses QR ordering immediately, and KhaoScan super admin will securely process account removal.
            </p>
          </div>

          {!hasDeletionRequest && !isDeletePanelOpen && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canRequestDeletion}
              onClick={() => setIsDeletePanelOpen(true)}
              className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-100 rounded-xl shrink-0"
            >
              Request Deletion
            </Button>
          )}
        </div>

        {hasDeletionRequest ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-white p-4 text-xs">
            <p className="font-bold text-rose-700">Deletion requested</p>
            <p className="mt-1 text-zinc-600">
              Requested on {formatDate(form.restaurant.deletionRequestedAt)}. Operations are paused until super admin review.
            </p>
            {form.restaurant.deletionReason ? <p className="mt-2 text-zinc-500">Reason: {form.restaurant.deletionReason}</p> : null}
          </div>
        ) : isDeletePanelOpen ? (
          <div className="mt-4 grid gap-3 pt-3 border-t border-rose-200/80 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Type &quot;{form.restaurant.name}&quot; to confirm:
              </label>
              <Input
                disabled={!canRequestDeletion || isRequestingDeletion}
                value={deleteName}
                onChange={(event) => setDeleteName(event.target.value)}
                placeholder={form.restaurant.name}
                className="h-9 text-xs bg-white rounded-xl focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Reason (optional):
              </label>
              <Input
                disabled={!canRequestDeletion || isRequestingDeletion}
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Closing outlet, migration..."
                className="h-9 text-xs bg-white rounded-xl focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!canRequestDeletion || isRequestingDeletion || deleteName.trim() !== form.restaurant.name}
                onClick={requestDeletion}
                className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                {isRequestingDeletion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Request Deletion
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isRequestingDeletion}
                onClick={() => {
                  setIsDeletePanelOpen(false);
                  setDeleteName("");
                  setDeleteReason("");
                }}
                className="h-8 text-xs rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </form>
  );
}

function formatDate(value: string | null) {
  if (!value) return "now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatLocationSource(value: SettingsFormState["restaurant"]["locationSource"]) {
  if (value === "GOOGLE_MAPS_LINK") return "Google Maps link";
  if (value === "OWNER_MANUAL") return "Manual coordinates";
  if (value === "PIN_PICKER") return "Map pin";
  if (value === "GEOCODED_ADDRESS") return "Address geocoding";
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
    <Card className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100">
        <div>
          <CardTitle className="text-sm font-black text-zinc-950">{title}</CardTitle>
          <CardDescription className="text-xs text-zinc-500 mt-0.5">{description}</CardDescription>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 shadow-xs">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </CardHeader>
      <div className="pt-4">{children}</div>
    </Card>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-xs font-bold text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
