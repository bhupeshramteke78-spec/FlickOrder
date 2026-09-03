"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { FoodImageSuggestion } from "@/lib/food-images";
import { getMatchingFoodImages } from "@/lib/food-images";
import { formatCurrency } from "@/lib/utils";

type FoodType = "VEG" | "NON_VEG" | "EGG";

type FormState = {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
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
  imageUrl: string | null;
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
  imageUrl: "",
  price: "",
  offerPrice: "",
  preparationTimeMinutes: "20",
  foodType: "VEG",
  isAvailable: true,
  isPopular: false,
};

export function MenuManagementClient({
  items,
  canManage,
}: {
  items: MenuItemRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");

  const [suggestions, setSuggestions] = useState<FoodImageSuggestion[]>([]);
  const [isCustomImageMode, setIsCustomImageMode] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(file: File | null | undefined) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Please choose a valid JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be 5 MB or smaller.");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/menu-items/upload-image", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;

      if (!response.ok || !body?.imageUrl) {
        toast.error(body?.error ?? "Unable to upload image.");
        return;
      }

      setForm((prev) => ({ ...prev, imageUrl: body.imageUrl! }));
      setIsCustomImageMode(true);
      toast.success("Photo uploaded successfully!");
    } catch {
      toast.error("Network error uploading photo.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLocaleLowerCase().includes(query) ||
        item.description?.toLocaleLowerCase().includes(query) ||
        item.category.toLocaleLowerCase().includes(query);
      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      const matchesAvailability =
        availabilityFilter === "ALL" ||
        (availabilityFilter === "AVAILABLE" && item.isAvailable && !item.isSoldOut) ||
        (availabilityFilter === "UNAVAILABLE" && !item.isAvailable && !item.isSoldOut) ||
        (availabilityFilter === "SOLD_OUT" && item.isSoldOut);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availabilityFilter, categoryFilter, items, search]);

  // Debounced real-time adaptive image suggestion lookup
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      const query = form.name.trim();
      const category = form.category.trim();

      if (query.length >= 2 || category.length >= 2) {
        try {
          const res = await fetch(
            `/api/menu-items/suggest-images?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { suggestions?: FoodImageSuggestion[] };
            if (data?.suggestions && data.suggestions.length > 0) {
              setSuggestions(data.suggestions);

              if (!form.imageUrl && !isCustomImageMode) {
                setForm((prev) => ({ ...prev, imageUrl: data.suggestions![0].url }));
              }
              return;
            }
          }
        } catch {
          // fallback
        }

        const matches = getMatchingFoodImages(query, category);
        setSuggestions(matches);

        if (!form.imageUrl && matches.length > 0 && !isCustomImageMode) {
          setForm((prev) => ({ ...prev, imageUrl: matches[0].url }));
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.name, form.category, isOpen, isCustomImageMode, form.imageUrl]);

  function updateField<T extends keyof FormState>(key: T, value: FormState[T]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectImage(url: string) {
    setForm((current) => ({ ...current, imageUrl: url }));
  }

  function openAddModal() {
    if (!canManage) {
      toast.error("Choose a plan to continue managing menu items.");
      return;
    }

    setEditingItemId(null);
    setForm(initialForm);
    setIsCustomImageMode(false);
    setSuggestions(getMatchingFoodImages("food"));
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
      imageUrl: item.imageUrl ?? "",
      price: String(item.price),
      offerPrice: item.offerPrice === null ? "" : String(item.offerPrice),
      preparationTimeMinutes: String(item.preparationTimeMinutes),
      foodType: item.foodType,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
    });
    setSuggestions(getMatchingFoodImages(item.name, item.category));
    setIsCustomImageMode(Boolean(item.imageUrl && !suggestions.some((s) => s.url === item.imageUrl)));
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
      imageUrl: form.imageUrl.trim() ? form.imageUrl.trim() : null,
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
      toast.error(body?.error ?? "Unable to save menu item.");
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

  async function deleteMenuItem(item: MenuItemRow) {
    if (!canManage) {
      toast.error("Choose a plan to manage menu items.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    setDeletingItemId(item.id);

    const response = await fetch("/api/menu-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });

    setDeletingItemId(null);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to delete item.");
      return;
    }

    toast.success(`"${item.name}" deleted.`);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <Input
          placeholder="Search menu items..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search menu items"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10"
          aria-label="Filter by category"
        >
          <option value="ALL">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={availabilityFilter}
          onChange={(event) => setAvailabilityFilter(event.target.value)}
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10"
          aria-label="Filter by availability"
        >
          <option value="ALL">All availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="UNAVAILABLE">Unavailable</option>
          <option value="SOLD_OUT">Sold out</option>
        </select>
        <Button type="button" onClick={openAddModal} disabled={!canManage}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      {filteredItems.length > 0 ? (
        <MenuItemsTable
          items={filteredItems}
          togglingItemId={togglingItemId}
          deletingItemId={deletingItemId}
          canManage={canManage}
          onEdit={openEditModal}
          onToggleAvailability={toggleAvailability}
          onDelete={deleteMenuItem}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No menu items yet"
          description="Click '+ Add item' to create your dishes with auto-matched food photography."
        />
      ) : (
        <EmptyState
          icon={Plus}
          title="No matching menu items"
          description="Adjust the search, category, or availability filters."
        />
      )}

      {/* Add / Edit Modal */}
      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-950/50 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-950">
                  {editingItemId ? "Edit Menu Item" : "Add Menu Item"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {editingItemId
                    ? "Update item details, auto-suggested photo, or pricing."
                    : "Add a dish to your menu. Photos match automatically as you type!"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={() => {
                  setIsOpen(false);
                  setEditingItemId(null);
                  setForm(initialForm);
                }}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitMenuItem} className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Dish Name *
                </span>
                <Input
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Paneer Butter Masala"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Category *
                </span>
                <Input
                  required
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  placeholder="e.g. Curries, Pizza, Breads"
                />
              </label>

              {/* Smart Food Photos & Upload Tray */}
              <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    handleImageFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    handleImageFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Dish Photography
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Camera
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomImageMode(!isCustomImageMode)}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      {isCustomImageMode ? "Use suggestions" : "Direct URL"}
                    </button>
                  </div>
                </div>

                {isUploadingImage ? (
                  <div className="my-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white p-4 text-xs font-semibold text-emerald-800 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading dish photo from device...
                  </div>
                ) : !isCustomImageMode ? (
                  <div className="mt-3">
                    <div className="grid grid-cols-3 gap-3">
                      {suggestions.map((suggestion) => {
                        const isSelected = form.imageUrl === suggestion.url;

                        return (
                          <div
                            key={suggestion.id}
                            onClick={() => selectImage(suggestion.url)}
                            className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                              isSelected
                                ? "border-emerald-600 ring-2 ring-emerald-500/30 shadow-md"
                                : "border-transparent opacity-75 hover:opacity-100 hover:border-emerald-300"
                            }`}
                          >
                            <div className="relative aspect-[4/3] w-full bg-zinc-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={suggestion.thumbnailUrl}
                                alt={suggestion.title}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                              />
                            </div>
                            {isSelected ? (
                              <div className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white shadow">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </div>
                            ) : null}
                            {suggestion.source.includes("Network") ? (
                              <div className="absolute bottom-1 left-1 rounded bg-zinc-900/80 px-1 py-0.5 text-[8px] font-bold text-emerald-300 backdrop-blur-xs">
                                🏪 In Database
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      ✨ Auto-matched suggestions. Click any photo, or use <strong>Upload / Camera</strong> above for real dish photos.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={form.imageUrl}
                      onChange={(event) => updateField("imageUrl", event.target.value)}
                      placeholder="Paste direct image URL (https://...)"
                    />
                    {form.imageUrl ? (
                      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-2.5">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={form.imageUrl}
                            alt="Custom preview"
                            className="h-12 w-12 rounded-lg object-cover border border-zinc-200"
                          />
                          <span className="text-xs font-semibold text-emerald-800">
                            Custom photo active
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateField("imageUrl", "")}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Remove photo
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Regular Price (₹) *
                </span>
                <Input
                  required
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="299"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Offer / Discount Price (₹)
                </span>
                <Input
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.offerPrice}
                  onChange={(event) => updateField("offerPrice", event.target.value)}
                  placeholder="249 (optional)"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Prep Time (Minutes) *
                </span>
                <Input
                  required
                  min={1}
                  type="number"
                  value={form.preparationTimeMinutes}
                  onChange={(event) => updateField("preparationTimeMinutes", event.target.value)}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Food Type *
                </span>
                <select
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10"
                  value={form.foodType}
                  onChange={(event) => updateField("foodType", event.target.value as FoodType)}
                >
                  <option value="VEG">Veg 🟢</option>
                  <option value="NON_VEG">Non-Veg 🔴</option>
                  <option value="EGG">Egg 🟡</option>
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Description
                </span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-emerald-700/50 focus:ring-4 focus:ring-emerald-700/10"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Fresh cottage cheese cooked in creamy tomato gravy with aromatic spices."
                />
              </label>

              <div className="sm:col-span-2 flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(event) => updateField("isAvailable", event.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  Available to order
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(event) => updateField("isPopular", event.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  Mark as Popular / Bestseller 🔥
                </label>
              </div>

              <div className="flex justify-end gap-3 sm:col-span-2 pt-4 border-t border-zinc-100">
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
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 text-white hover:bg-emerald-800">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingItemId ? "Save changes" : "Add to Menu"}
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
  deletingItemId,
  canManage,
  onEdit,
  onToggleAvailability,
  onDelete,
}: {
  items: MenuItemRow[];
  togglingItemId: string | null;
  deletingItemId: string | null;
  canManage: boolean;
  onEdit: (item: MenuItemRow) => void;
  onToggleAvailability: (item: MenuItemRow) => void;
  onDelete: (item: MenuItemRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid grid-cols-[auto_1.2fr_0.8fr_0.7fr_0.7fr_1fr_0.8fr_auto] items-center gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <span className="w-12">Photo</span>
        <span>Item Name</span>
        <span>Category</span>
        <span>Price</span>
        <span>Offer</span>
        <span>Status</span>
        <span>Prep Time</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-zinc-100">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[auto_1.2fr_0.8fr_0.7fr_0.7fr_1fr_0.8fr_auto] items-center gap-4 px-4 py-3 text-sm hover:bg-zinc-50/70 transition"
          >
            {/* Dish Thumbnail */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-zinc-400">
                  <Utensils className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Name & Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    item.foodType === "VEG"
                      ? "bg-emerald-500 ring-2 ring-emerald-200"
                      : item.foodType === "NON_VEG"
                        ? "bg-rose-500 ring-2 ring-rose-200"
                        : "bg-amber-500 ring-2 ring-amber-200"
                  }`}
                  title={item.foodType}
                />
                <p className="truncate font-bold text-zinc-950">{item.name}</p>
                {item.isPopular ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700">
                    Bestseller
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                {item.description ?? "No description"}
              </p>
            </div>

            <span className="font-medium text-zinc-700">{item.category}</span>
            <span className="font-bold text-zinc-950">{formatCurrency(item.price)}</span>
            <span className="font-semibold text-emerald-700">
              {item.offerPrice === null ? "-" : formatCurrency(item.offerPrice)}
            </span>

            {/* Availability Toggle */}
            <span className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canManage || togglingItemId === item.id || item.isSoldOut}
                onClick={() => onToggleAvailability(item)}
                className="menu-switch"
                data-state={item.isAvailable ? "available" : "unavailable"}
                data-loading={togglingItemId === item.id ? "true" : "false"}
                aria-pressed={item.isAvailable}
                aria-label={`Mark ${item.name} ${item.isAvailable ? "unavailable" : "available"}`}
              >
                <span className="menu-switch-track">
                  <span className="menu-switch-knob">
                    {togglingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin text-zinc-500" /> : null}
                  </span>
                </span>
              </button>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.isSoldOut
                    ? "bg-rose-100 text-rose-800"
                    : item.isAvailable
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {item.isSoldOut ? "Sold out" : item.isAvailable ? "Available" : "Hidden"}
              </span>
            </span>

            <span className="text-zinc-600 font-medium">{item.preparationTimeMinutes} min</span>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!canManage}
                onClick={() => onEdit(item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={!canManage || deletingItemId === item.id}
                onClick={() => onDelete(item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                aria-label={`Delete ${item.name}`}
              >
                {deletingItemId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
