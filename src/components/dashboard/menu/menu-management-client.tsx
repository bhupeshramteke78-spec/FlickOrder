"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { FoodImageSuggestion } from "@/lib/food-images";
import { getMatchingFoodImages } from "@/lib/food-images";
import { parseItemVariants, serializeItemVariants, getItemDisplayPrice, type ItemPortion } from "@/lib/item-variants";
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
  hasPortions: boolean;
  portions: ItemPortion[];
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
  hasPortions: false,
  portions: [
    { name: "Half Plate", price: 160 },
    { name: "Full Plate", price: 280 },
  ],
};

const predefinedCategories = ["All Categories", "Main Course", "Appetizers", "Desserts", "Beverages"];

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
  const [activeCategory, setActiveCategory] = useState("All Categories");

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

  const existingCategories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items],
  );

  const categoryList = useMemo(() => {
    const combined = ["All Categories", ...Array.from(new Set([...predefinedCategories.slice(1), ...existingCategories]))];
    return combined;
  }, [existingCategories]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLocaleLowerCase().includes(query) ||
        item.description?.toLocaleLowerCase().includes(query) ||
        item.category.toLocaleLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "All Categories" ||
        item.category.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, items, search]);

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

    const parsedVariants = parseItemVariants(item.description);

    setEditingItemId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      description: parsedVariants.description,
      imageUrl: item.imageUrl ?? "",
      price: String(item.price),
      offerPrice: item.offerPrice === null ? "" : String(item.offerPrice),
      preparationTimeMinutes: String(item.preparationTimeMinutes),
      foodType: item.foodType,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      hasPortions: parsedVariants.hasPortions,
      portions: parsedVariants.hasPortions
        ? parsedVariants.portions
        : [
            { name: "Half Plate", price: Math.round(item.price * 0.6) },
            { name: "Full Plate", price: item.price },
          ],
    });
    setSuggestions(getMatchingFoodImages(item.name, item.category));
    setIsCustomImageMode(Boolean(item.imageUrl && !suggestions.some((s) => s.url === item.imageUrl)));
    setIsOpen(true);
  }

  async function submitMenuItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const finalDescription = form.hasPortions
      ? serializeItemVariants(form.description, form.portions)
      : form.description.replace(/<!--portions:.*?-->/g, "").trim();

    const minPortionPrice = form.hasPortions && form.portions.length > 0
      ? Math.min(...form.portions.map((p) => p.price))
      : Number(form.price);

    const payload = {
      ...(editingItemId ? { id: editingItemId } : {}),
      name: form.name,
      category: form.category,
      description: finalDescription || undefined,
      imageUrl: form.imageUrl.trim() ? form.imageUrl.trim() : null,
      price: minPortionPrice,
      offerPrice: form.hasPortions ? null : (form.offerPrice ? Number(form.offerPrice) : null),
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
    <div className="space-y-6">
      {/* Header Bar matching DineFlow Page 9 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Menu Management</h2>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">
            Add, edit, and organize your digital QR menu items
          </p>
        </div>

        <Button
          type="button"
          onClick={openAddModal}
          disabled={!canManage}
          className="h-10 gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 shadow-sm shadow-rose-600/20"
        >
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {/* Category Tabs & Search Bar matching Page 9 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {categoryList.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap shadow-xs ${
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish name..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 placeholder-zinc-400 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      {/* Cards Grid matching DineFlow Page 9 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => {
          const parsed = parseItemVariants(item.description);
          const displayPrice = getItemDisplayPrice(item.price, item.offerPrice, parsed.portions);
          const isAvailable = item.isAvailable && !item.isSoldOut;

          return (
            <Card
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Photo with status badge matching Page 9 */}
                <div className="relative h-44 w-full overflow-hidden bg-zinc-100">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-zinc-400">
                      <Utensils className="h-8 w-8" />
                    </div>
                  )}

                  {/* Availability Badge Pill */}
                  <span
                    className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                      isAvailable
                        ? "bg-emerald-500/90 text-white"
                        : "bg-zinc-900/80 text-zinc-300"
                    }`}
                  >
                    {isAvailable ? "AVAILABLE" : "OUT OF STOCK"}
                  </span>

                  {/* Action overlay buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => openEditModal(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-zinc-700 shadow-sm hover:bg-white hover:text-zinc-950 transition"
                      title="Edit dish"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!canManage || deletingItemId === item.id}
                      onClick={() => deleteMenuItem(item)}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-rose-600 shadow-sm hover:bg-rose-50 transition"
                      title="Delete dish"
                    >
                      {deletingItemId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Dish Info Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-zinc-950 line-clamp-1 leading-tight">
                      {item.name}
                    </h3>
                    <span className="font-black text-sm text-rose-600 shrink-0">
                      {displayPrice}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                    {parsed.description || "Freshly crafted delicious restaurant preparation."}
                  </p>
                </div>
              </div>

              {/* Bottom Tag & Toggle Switch matching Page 9 */}
              <div className="flex items-center justify-between border-t border-zinc-100 p-4 pt-3 mt-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {item.category}
                </span>

                {/* Switch Toggle */}
                <button
                  type="button"
                  disabled={!canManage || togglingItemId === item.id}
                  onClick={() => toggleAvailability(item)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isAvailable ? "bg-rose-600" : "bg-zinc-200"
                  }`}
                  title={isAvailable ? "Mark Unavailable" : "Mark Available"}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                      isAvailable ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </Card>
          );
        })}

        {/* Quick Add Item Dashed Card matching Page 9 */}
        <button
          type="button"
          onClick={openAddModal}
          disabled={!canManage}
          className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200/90 bg-white/50 p-6 text-center transition-all duration-200 hover:border-rose-400 hover:bg-rose-50/20 active:scale-[0.99]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-400 transition group-hover:text-rose-600">
            <Plus className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs font-bold text-zinc-700">Quick Add Item</p>
          <p className="mt-1 text-[11px] text-zinc-400 font-medium">Click to create new menu item</p>
        </button>
      </div>

      {filteredItems.length === 0 && (
        <EmptyState
          icon={Utensils}
          title="No matching menu items"
          description="Try selecting a different category tab or changing your search terms."
        />
      )}

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-zinc-950">
                  {editingItemId ? "Edit Menu Item" : "Add Menu Item"}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 font-medium">
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
                  placeholder="e.g. Classic Beef Burger"
                  className="rounded-xl"
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
                  placeholder="e.g. Main Course, Appetizers"
                  className="rounded-xl"
                />
              </label>

              {/* Photo Upload / Suggestions Tray */}
              <div className="sm:col-span-2 rounded-xl border border-rose-100 bg-rose-50/30 p-4">
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
                  <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-rose-600" />
                    Dish Photography
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 transition"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Camera
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomImageMode(!isCustomImageMode)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      {isCustomImageMode ? "Use suggestions" : "Direct URL"}
                    </button>
                  </div>
                </div>

                {isUploadingImage ? (
                  <div className="my-4 flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white p-4 text-xs font-semibold text-rose-800 shadow-sm">
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
                                ? "border-rose-600 shadow-md ring-2 ring-rose-300"
                                : "border-zinc-200 hover:border-rose-300"
                            }`}
                          >
                            <div className="relative h-20 w-full bg-zinc-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={suggestion.url}
                                alt={suggestion.label}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              {isSelected ? (
                                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white">
                                  <Check className="h-3 w-3" />
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate bg-white p-1.5 text-center text-[10px] font-semibold text-zinc-700">
                              {suggestion.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Input
                      value={form.imageUrl}
                      onChange={(event) => updateField("imageUrl", event.target.value)}
                      placeholder="Paste direct HTTPS image link..."
                      className="h-10 bg-white rounded-xl"
                    />
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
                  className="rounded-xl"
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
                  className="rounded-xl"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Description
                </span>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Premium patty with cheddar cheese, caramelized onions, and house sauce."
                />
              </label>

              <div className="flex justify-end gap-3 sm:col-span-2 pt-4 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingItemId(null);
                    setForm(initialForm);
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold px-5"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingItemId ? "Save Changes" : "Add to Menu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
