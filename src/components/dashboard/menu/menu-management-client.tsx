"use client";

import { Loader2, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type FoodType = "VEG" | "NON_VEG" | "EGG";

type FormState = {
  name: string;
  category: string;
  description: string;
  price: string;
  offerPrice: string;
  preparationTimeMinutes: string;
  foodType: FoodType;
  isAvailable: boolean;
  isPopular: boolean;
};

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  offerPrice: number | null;
  preparationTimeMinutes: number;
  foodType: FoodType;
  isAvailable: boolean;
  isSoldOut: boolean;
  isPopular: boolean;
};

const initialForm: FormState = {
  name: "",
  category: "",
  description: "",
  price: "",
  offerPrice: "",
  preparationTimeMinutes: "20",
  foodType: "VEG",
  isAvailable: true,
  isPopular: false,
};

export function MenuManagementClient({ items, canManage }: { items: MenuItemRow[]; canManage: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  function updateField<T extends keyof FormState>(key: T, value: FormState[T]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAddModal() {
    if (!canManage) {
      toast.error("Choose a plan to continue managing menu items.");
      return;
    }

    setEditingItemId(null);
    setForm(initialForm);
    setIsOpen(true);
  }

  function openEditModal(item: MenuItemRow) {
    if (!canManage) {
      toast.error("Choose a plan to continue managing menu items.");
      return;
    }

    setEditingItemId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      price: String(item.price),
      offerPrice: item.offerPrice === null ? "" : String(item.offerPrice),
      preparationTimeMinutes: String(item.preparationTimeMinutes),
      foodType: item.foodType,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
    });
    setIsOpen(true);
  }

  async function submitMenuItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...(editingItemId ? { id: editingItemId } : {}),
      name: form.name,
      category: form.category,
      description: form.description || undefined,
      price: Number(form.price),
      offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
      preparationTimeMinutes: Number(form.preparationTimeMinutes),
      foodType: form.foodType,
      isAvailable: form.isAvailable,
      isPopular: form.isPopular,
    };

    const response = await fetch("/api/menu-items", {
      method: editingItemId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to add menu item.");
      return;
    }

    toast.success(editingItemId ? "Menu item updated." : "Menu item added.");
    setForm(initialForm);
    setEditingItemId(null);
    setIsOpen(false);
    router.refresh();
  }

  async function toggleAvailability(item: MenuItemRow) {
    if (!canManage) {
      toast.error("Choose a plan to continue managing menu items.");
      return;
    }

    setTogglingItemId(item.id);

    const response = await fetch("/api/menu-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
    });

    setTogglingItemId(null);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to update availability.");
      return;
    }

    toast.success(!item.isAvailable ? "Item marked available." : "Item marked unavailable.");
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <Input placeholder="Search menu items" />
        <Input placeholder="Category" />
        <Input placeholder="Availability" />
        <Button type="button" onClick={openAddModal} disabled={!canManage}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>
      {items.length > 0 ? (
        <MenuItemsTable
          items={items}
          togglingItemId={togglingItemId}
          canManage={canManage}
          onEdit={openEditModal}
          onToggleAvailability={toggleAvailability}
        />
      ) : (
        <EmptyState
          icon={Plus}
          title="No menu items loaded"
          description="Create categories and menu items in Supabase. Availability, popular flags, offer prices, and preparation time are modeled in the database."
        />
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">{editingItemId ? "Edit menu item" : "Add menu item"}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {editingItemId ? "Update item details, pricing, and availability." : "Add an item to your restaurant menu with server-side validation."}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={() => {
                  setIsOpen(false);
                  setEditingItemId(null);
                  setForm(initialForm);
                }}
                aria-label="Close add item modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitMenuItem} className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-medium text-zinc-700">Item name</span>
                <Input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Margherita Pizza" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-zinc-700">Category</span>
                <Input required value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Pizza" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-zinc-700">Price</span>
                <Input required min={0} step="0.01" type="number" value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="299" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-zinc-700">Offer price</span>
                <Input min={0} step="0.01" type="number" value={form.offerPrice} onChange={(event) => updateField("offerPrice", event.target.value)} placeholder="249" />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-zinc-700">Preparation time</span>
                <Input required min={1} type="number" value={form.preparationTimeMinutes} onChange={(event) => updateField("preparationTimeMinutes", event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-zinc-700">Food type</span>
                <select
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10"
                  value={form.foodType}
                  onChange={(event) => updateField("foodType", event.target.value as FoodType)}
                >
                  <option value="VEG">Veg</option>
                  <option value="NON_VEG">Non-veg</option>
                  <option value="EGG">Egg</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-zinc-700">Description</span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Classic delight with fresh toppings."
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={form.isAvailable} onChange={(event) => updateField("isAvailable", event.target.checked)} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={form.isPopular} onChange={(event) => updateField("isPopular", event.target.checked)} />
                Popular item
              </label>
              <div className="flex justify-end gap-3 sm:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingItemId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingItemId ? "Save changes" : "Save item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuItemsTable({
  items,
  togglingItemId,
  canManage,
  onEdit,
  onToggleAvailability,
}: {
  items: MenuItemRow[];
  togglingItemId: string | null;
  canManage: boolean;
  onEdit: (item: MenuItemRow) => void;
  onToggleAvailability: (item: MenuItemRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.3fr_0.8fr_0.7fr_0.7fr_1fr_0.8fr_0.55fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>Item</span>
        <span>Category</span>
        <span>Price</span>
        <span>Offer</span>
        <span>Status</span>
        <span>Prep time</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-zinc-200">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1.3fr_0.8fr_0.7fr_0.7fr_1fr_0.8fr_0.55fr] items-center gap-4 px-4 py-4 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-zinc-950">{item.name}</p>
                {item.isPopular ? <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">Popular</span> : null}
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{item.description ?? "No description"}</p>
            </div>
            <span className="text-zinc-700">{item.category}</span>
            <span className="font-medium text-zinc-950">{formatCurrency(item.price)}</span>
            <span className="text-zinc-700">{item.offerPrice === null ? "-" : formatCurrency(item.offerPrice)}</span>
            <span className="flex items-center gap-3">
              <button
                type="button"
                disabled={!canManage || togglingItemId === item.id || item.isSoldOut}
                onClick={() => onToggleAvailability(item)}
                className="menu-availability-toggle"
                data-state={item.isAvailable ? "available" : "unavailable"}
                data-loading={togglingItemId === item.id ? "true" : "false"}
                aria-pressed={item.isAvailable}
                aria-label={`Mark ${item.name} ${item.isAvailable ? "unavailable" : "available"}`}
              >
                <span className="menu-availability-track" />
                <span className="menu-availability-knob" />
              </button>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  item.isSoldOut
                    ? "bg-rose-50 text-rose-700"
                    : item.isAvailable
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                }`}>
                  {item.isSoldOut ? "Sold out" : item.isAvailable ? "Available" : "Unavailable"}
                </span>
            </span>
            <span className="text-zinc-700">{item.preparationTimeMinutes} min</span>
            <span>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => onEdit(item)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
