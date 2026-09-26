"use client";

import {
  Camera,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      toast.error(body?.error ?? "Unable to save settings.");
      return;
    }

    toast.success("Settings saved successfully.");
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

    toast.success("Deletion request sent to KhaoScan super admin.");
    setDeleteName("");
    setDeleteReason("");
    router.refresh();
  }

  return (
    <form onSubmit={submitSettings} className="space-y-6">
      {/* Header Bar matching DineFlow Page 6 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">General Settings</h2>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">
            Customize your restaurant profile and system preferences
          </p>
        </div>

        <Button
          type="submit"
          disabled={!canEdit || isSaving}
          className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 shadow-sm shadow-rose-600/20"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Card 1: Restaurant Profile matching Page 6 */}
      <Card className="rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-sm">
        <h3 className="text-base font-black text-zinc-950">Restaurant Profile</h3>
        <p className="text-xs text-zinc-500 font-medium mt-0.5">
          Public information shown on discovery and QR menu landing pages
        </p>

        {/* Logo Avatar Upload Box matching Page 6 */}
        <div className="mt-6 flex flex-wrap items-center gap-5 pb-6 border-b border-zinc-100">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-rose-100 border border-rose-200 text-2xl font-black text-rose-700 shadow-sm overflow-hidden">
              {form.restaurant.logoUrl ? (
                <img src={form.restaurant.logoUrl} alt={form.restaurant.name} className="h-full w-full object-cover" />
              ) : (
                form.restaurant.name ? form.restaurant.name.slice(0, 2).toUpperCase() : "DF"
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-white shadow-sm">
              <Camera className="h-3 w-3" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-900">Restaurant Logo</h4>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
              Recommended size: 400x400px. JPG, PNG or WebP.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <Input
                disabled={!canEdit}
                value={form.restaurant.logoUrl}
                onChange={(event) => updateRestaurant("logoUrl", event.target.value)}
                placeholder="Paste Logo Image URL..."
                className="h-8 w-64 text-xs rounded-xl bg-zinc-50 border-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Form Inputs Grid matching Page 6 Uppercase Labels */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              RESTAURANT NAME
            </label>
            <Input
              disabled={!canEdit}
              required
              value={form.restaurant.name}
              onChange={(event) => updateRestaurant("name", event.target.value)}
              className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              CONTACT EMAIL
            </label>
            <Input
              disabled={!canEdit}
              required
              type="email"
              value={form.restaurant.email}
              onChange={(event) => updateRestaurant("email", event.target.value)}
              className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              PHONE NUMBER
            </label>
            <Input
              disabled={!canEdit}
              required
              value={form.restaurant.phone}
              onChange={(event) => updateRestaurant("phone", event.target.value)}
              className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              RESTAURANT TYPE & CUISINE
            </label>
            <Input
              disabled={!canEdit}
              required
              value={form.restaurant.type}
              onChange={(event) => updateRestaurant("type", event.target.value)}
              placeholder="Cafe, Fine Dining, Pizzeria"
              className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              ADDRESS
            </label>
            <Input
              disabled={!canEdit}
              required
              value={form.restaurant.address}
              onChange={(event) => updateRestaurant("address", event.target.value)}
              placeholder="123 Culinary Ave, Food District, NY 10001"
              className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              CITY & STATE
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                disabled={!canEdit}
                required
                value={form.restaurant.city}
                onChange={(event) => updateRestaurant("city", event.target.value)}
                placeholder="City"
                className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
              />
              <Input
                disabled={!canEdit}
                required
                value={form.restaurant.state}
                onChange={(event) => updateRestaurant("state", event.target.value)}
                placeholder="State"
                className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              DIRECT UPI PAYMENT ID (FOR SETTLEMENTS)
            </label>
            <Input
              disabled={!canEdit}
              value={form.settings.upiId}
              onChange={(event) => updateSettings("upiId", event.target.value)}
              placeholder="merchant@okhdfcbank"
              className="h-10 text-xs font-semibold rounded-xl border-zinc-200"
            />
          </div>
        </div>
      </Card>

      {/* Card 2: System Preferences matching Page 6 */}
      <Card className="rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-sm">
        <h3 className="text-base font-black text-zinc-950">System Preferences</h3>
        <p className="text-xs text-zinc-500 font-medium mt-0.5">
          Automation toggles, live ordering, and operational controls
        </p>

        <div className="mt-6 divide-y divide-zinc-100">
          {/* QR Ordering Toggle matching Page 6 */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold text-zinc-900">QR Ordering</p>
              <p className="text-[11px] text-zinc-500 font-medium">
                Allow customers to place orders directly via QR scan
              </p>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => updateSettings("qrOrderingEnabled", !form.settings.qrOrderingEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.settings.qrOrderingEnabled ? "bg-rose-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  form.settings.qrOrderingEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Push Notifications Toggle matching Page 6 */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold text-zinc-900">Push Notifications</p>
              <p className="text-[11px] text-zinc-500 font-medium">
                Get alerted for new orders and kitchen updates
              </p>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => updateRestaurant("isOpen", !form.restaurant.isOpen)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.restaurant.isOpen ? "bg-rose-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  form.restaurant.isOpen ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Menu Preferences Toggle */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-bold text-zinc-900">Show Popular Dishes First</p>
              <p className="text-[11px] text-zinc-500 font-medium">
                Rank top ordered items at the top of guest mobile menus
              </p>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => updateSettings("showPopularFirst", !form.settings.showPopularFirst)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.settings.showPopularFirst ? "bg-rose-600" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  form.settings.showPopularFirst ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Account Deletion Safety Card */}
      <Card className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-950">Delete Restaurant Account</h3>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed max-w-xl">
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
              className="text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-100 rounded-xl"
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
                className="h-9 text-xs bg-white rounded-xl"
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
                placeholder="Reason for leaving..."
                className="h-9 text-xs bg-white rounded-xl"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                disabled={!canRequestDeletion || isRequestingDeletion || deleteName.trim() !== form.restaurant.name}
                onClick={requestDeletion}
                className="h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {isRequestingDeletion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Deletion Request
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDeletePanelOpen(false)}
                className="h-8 text-xs font-semibold text-zinc-600"
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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
