"use client";

import { Loader2, Minus, Plus, Search, ShoppingCart, UserRound, Utensils, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { parseItemVariants, getItemDisplayPrice, type ItemPortion } from "@/lib/item-variants";

export type CustomerMenuCategory = {
  id: string;
  name: string;
};

export type CustomerMenuItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  offerPrice: number | null;
  preparationTimeMinutes: number;
  foodType: "VEG" | "NON_VEG" | "EGG";
  isAvailable: boolean;
  isSoldOut: boolean;
  isPopular: boolean;
};

type MobileMenuShellProps = {
  restaurantSlug: string;
  restaurantName: string;
  upiId: string | null;
  upiDisplayName: string | null;
  taxRate?: number;
  tableNumber: string;
  categories: CustomerMenuCategory[];
  menuItems: CustomerMenuItem[];
  mode?: "ordering" | "preview";
};

type CartItem = {
  item: CustomerMenuItem;
  quantity: number;
  portion?: ItemPortion;
};

type PlacedOrder = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "VERIFICATION_PENDING" | "PAID" | "FAILED" | "REFUNDED";
  total: number;
};

type PaymentMethod = "UPI" | "CASH";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const quickOptions = ["Less Spicy", "Extra Cheese", "Extra Plate", "Extra Spoon", "Extra Tissue", "Serve Together"];

function getGuestServiceOptions(guestCount: number) {
  return [`${guestCount} Plates`, `${guestCount} Spoons`, `${guestCount} Tissues`];
}

export function MobileMenuShell({ restaurantSlug, restaurantName, upiId, upiDisplayName, taxRate = 0, tableNumber, categories, menuItems, mode = "ordering" }: MobileMenuShellProps) {
  const isPreviewMode = mode === "preview";
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [foodTypeFilter, setFoodTypeFilter] = useState<"ALL" | CustomerMenuItem["foodType"]>("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [addOnCartItems, setAddOnCartItems] = useState<CartItem[]>([]);
  const [isAddingMoreItems, setIsAddingMoreItems] = useState(false);
  const [isSavingAddOnItems, setIsSavingAddOnItems] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [portionModalItem, setPortionModalItem] = useState<{
    item: CustomerMenuItem;
    portions: ItemPortion[];
    selectedPortion: ItemPortion;
    quantity: number;
  } | null>(null);

  function getCartItemKey(cartItem: CartItem): string {
    return `${cartItem.item.id}::${cartItem.portion?.name ?? "default"}`;
  }

  function getItemUnitPrice(cartItem: CartItem): number {
    if (cartItem.portion) {
      return cartItem.portion.price;
    }
    return cartItem.item.offerPrice ?? cartItem.item.price;
  }

  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;
  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = isSearching || activeCategoryId === "all" || (activeCategory ? item.categoryName === activeCategory.name : true);
      const matchesSearch =
        !isSearching ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description?.toLowerCase().includes(normalizedSearch);
      const matchesFoodType = foodTypeFilter === "ALL" || item.foodType === foodTypeFilter;
      const matchesAvailability = !onlyAvailable || (item.isAvailable && !item.isSoldOut);
      const matchesPopularity = !onlyPopular || item.isPopular;

      return matchesCategory && matchesSearch && matchesFoodType && matchesAvailability && matchesPopularity;
    });
  }, [activeCategory, activeCategoryId, foodTypeFilter, isSearching, menuItems, normalizedSearch, onlyAvailable, onlyPopular]);

  const taxRatePercent = Number(taxRate ?? 0);
  const cartSubtotal = cartItems.reduce((total, cartItem) => total + getItemUnitPrice(cartItem) * cartItem.quantity, 0);
  const cartTax = Math.round((cartSubtotal * (taxRatePercent / 100)) * 100) / 100;
  const cartTotal = cartSubtotal + cartTax;

  const addOnSubtotal = addOnCartItems.reduce((total, cartItem) => total + getItemUnitPrice(cartItem) * cartItem.quantity, 0);
  const addOnTax = Math.round((addOnSubtotal * (taxRatePercent / 100)) * 100) / 100;
  const addOnTotal = addOnSubtotal + addOnTax;
  const payableTotal = placedOrder ? placedOrder.total : cartTotal;
  const canPlaceOrder = cartItems.length > 0 && customerName.trim().length >= 2 && guestCount >= 1 && guestCount <= 30 && !placedOrder;
  const canAttemptOrder = cartItems.length > 0 && !placedOrder && !isPlacingOrder;
  const orderIsServed = placedOrder?.status === "SERVED";
  const canAddMoreItems = placedOrder?.paymentStatus === "UNPAID";
  const canSaveAddOnItems = canAddMoreItems && addOnCartItems.length > 0 && !isSavingAddOnItems;
  const hasCartActivity = !isPreviewMode && (cartItems.length > 0 || Boolean(placedOrder));
  const shouldShowCartPanel = hasCartActivity && isCartPanelOpen;
  const cartItemCount = cartItems.reduce((total, cartItem) => total + cartItem.quantity, 0);

  useEffect(() => {
    if (!placedOrder || placedOrder.paymentStatus === "PAID") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${placedOrder.id}`);
      const body = (await response.json().catch(() => null)) as { order?: PlacedOrder } | null;

      if (response.ok && body?.order) {
        setPlacedOrder(body.order);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [placedOrder]);

  function addToCart(item: CustomerMenuItem) {
    const parsedVariants = parseItemVariants(item.description);
    if (parsedVariants.hasPortions && parsedVariants.portions.length > 0) {
      setPortionModalItem({
        item,
        portions: parsedVariants.portions,
        selectedPortion: parsedVariants.portions[0],
        quantity: 1,
      });
      return;
    }

    const setTargetCartItems = placedOrder && isAddingMoreItems ? setAddOnCartItems : setCartItems;

    setTargetCartItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.item.id === item.id && !cartItem.portion);

      if (existingItem) {
        return currentItems.map((cartItem) => (
          cartItem.item.id === item.id && !cartItem.portion ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        ));
      }

      return [...currentItems, { item, quantity: 1 }];
    });

    if (!placedOrder) {
      setIsCartPanelOpen(false);
    }
  }

  function addPortionToCart(item: CustomerMenuItem, portion: ItemPortion, quantity: number) {
    const setTargetCartItems = placedOrder && isAddingMoreItems ? setAddOnCartItems : setCartItems;

    setTargetCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) => cartItem.item.id === item.id && cartItem.portion?.name === portion.name
      );

      if (existingItem) {
        return currentItems.map((cartItem) => (
          cartItem.item.id === item.id && cartItem.portion?.name === portion.name
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        ));
      }

      return [...currentItems, { item, quantity, portion }];
    });

    setPortionModalItem(null);
    toast.success(`Added ${quantity}x ${item.name} (${portion.name})`);
  }

  function updateCartItemsQuantity(setTargetCartItems: Dispatch<SetStateAction<CartItem[]>>, itemKey: string, change: number) {
    setTargetCartItems((currentItems) => (
      currentItems
        .map((cartItem) => (
          getCartItemKey(cartItem) === itemKey ? { ...cartItem, quantity: cartItem.quantity + change } : cartItem
        ))
        .filter((cartItem) => cartItem.quantity > 0)
    ));
  }

  function updateCartQuantity(itemKey: string, change: number) {
    updateCartItemsQuantity(setCartItems, itemKey, change);
  }

  function updateAddOnCartQuantity(itemKey: string, change: number) {
    updateCartItemsQuantity(setAddOnCartItems, itemKey, change);
  }

  function removeFromCart(itemKey: string) {
    setCartItems((currentItems) => currentItems.filter((cartItem) => getCartItemKey(cartItem) !== itemKey));
  }

  function removeFromAddOnCart(itemKey: string) {
    setAddOnCartItems((currentItems) => currentItems.filter((cartItem) => getCartItemKey(cartItem) !== itemKey));
  }

  function mergeCartItems(baseItems: CartItem[], newItems: CartItem[]) {
    return newItems.reduce<CartItem[]>((mergedItems, newItem) => {
      const existingItem = mergedItems.find(
        (cartItem) => getCartItemKey(cartItem) === getCartItemKey(newItem)
      );

      if (!existingItem) {
        return [...mergedItems, newItem];
      }

      return mergedItems.map((cartItem) => (
        getCartItemKey(cartItem) === getCartItemKey(newItem)
          ? { ...cartItem, quantity: cartItem.quantity + newItem.quantity }
          : cartItem
      ));
    }, baseItems);
  }

  function toggleQuickOption(option: string) {
    setSelectedOptions((currentOptions) => (
      currentOptions.includes(option)
        ? currentOptions.filter((currentOption) => currentOption !== option)
        : [...currentOptions, option]
    ));
  }

  function updateGuestCount(nextCount: number) {
    const normalizedCount = Math.min(30, Math.max(1, nextCount));
    setGuestCount(normalizedCount);
  }

  async function placeOrder() {
    if (!canPlaceOrder || isPlacingOrder) {
      if (customerName.trim().length < 2) {
        setShowNamePrompt(true);
        toast.error("Please enter your name before placing the order.");
      }
      return;
    }

    setShowNamePrompt(false);
    setIsPlacingOrder(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantSlug,
        tableNumber,
        customerName,
        guestCount,
        items: cartItems.map((cartItem) => ({
          menuItemId: cartItem.item.id,
          quantity: cartItem.quantity,
          options: [
            ...(cartItem.portion ? [cartItem.portion.name] : []),
            ...selectedOptions,
          ],
        })),
      }),
    });

    setIsPlacingOrder(false);

    const body = (await response.json().catch(() => null)) as { orderId?: string; orderNumber?: string; error?: string } | null;

    if (!response.ok || !body?.orderId) {
      toast.error(body?.error ?? "Unable to place order.");
      return;
    }

    toast.success("Order placed.");
    setPlacedOrder({
      id: body.orderId,
      orderNumber: body.orderNumber ?? "Order",
      status: "PENDING",
      paymentStatus: "UNPAID",
      total: cartTotal,
    });
    setIsCartPanelOpen(true);
  }

  async function requestPayment(method: PaymentMethod) {
    if (!placedOrder || isRequestingPayment) {
      return;
    }

    setSelectedPaymentMethod(method);
    setIsRequestingPayment(true);
    setPaymentMessage(null);

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: placedOrder.id,
        method,
        customerName,
      }),
    });

    setIsRequestingPayment(false);

    const body = (await response.json().catch(() => null)) as { transactionNote?: string; error?: string } | null;

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to request payment verification.");
      return;
    }

    setPlacedOrder({ ...placedOrder, paymentStatus: "VERIFICATION_PENDING" });

    if (method === "UPI" && upiId) {
      const upiUrl = createUpiUrl({
        upiId,
        payeeName: upiDisplayName ?? restaurantName,
        amount: placedOrder.total,
        note: body?.transactionNote ?? placedOrder.orderNumber,
      });
      window.location.href = upiUrl;
      setPaymentMessage("UPI app opened. After payment, wait for restaurant confirmation.");
    } else {
      setPaymentMessage(method === "CASH" ? "Cash payment noted. Please pay at the counter or to staff." : "Payment verification requested.");
    }

    toast.success("Payment sent for restaurant verification.");
  }

  async function saveAddOnItems() {
    if (!placedOrder || !canSaveAddOnItems) {
      return;
    }

    setIsSavingAddOnItems(true);

    const response = await fetch(`/api/orders/${placedOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_ITEMS",
        restaurantSlug,
        tableNumber,
        items: addOnCartItems.map((cartItem) => ({
          menuItemId: cartItem.item.id,
          quantity: cartItem.quantity,
          options: [
            ...(cartItem.portion ? [cartItem.portion.name] : []),
            ...selectedOptions,
          ],
        })),
      }),
    });

    setIsSavingAddOnItems(false);

    const body = (await response.json().catch(() => null)) as { order?: PlacedOrder; error?: string } | null;

    if (!response.ok || !body?.order) {
      toast.error(body?.error ?? "Unable to add items to this order.");
      return;
    }

    setPlacedOrder(body.order);
    setCartItems((currentItems) => mergeCartItems(currentItems, addOnCartItems));
    setAddOnCartItems([]);
    setIsAddingMoreItems(false);
    setIsCartPanelOpen(true);
    toast.success("Added items to your order.");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <header className="sticky top-0 z-20 bg-[#06401f] text-white shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-center px-4 py-4 text-center">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-normal sm:text-3xl">{restaurantName}</h1>
            {!isPreviewMode ? <p className="mt-1 text-sm font-medium text-emerald-100">Table {tableNumber}</p> : null}
          </div>
        </div>
      </header>

      <section className={`mx-auto grid gap-4 px-4 py-4 ${hasCartActivity && !shouldShowCartPanel ? "pb-28" : ""} ${shouldShowCartPanel ? "max-w-7xl lg:grid-cols-[1fr_360px]" : "max-w-5xl"}`}>
        <div>
          <div className="mb-4 flex items-center gap-3 text-sm">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Open</span>
            <span className="text-zinc-500">Closes at 11:00 PM</span>
          </div>

          {categories.length > 0 ? (
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
              {[{ id: "all", name: "All" }, ...categories].map((category) => {
                const isActive = category.id === activeCategoryId;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-900/10"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-200 hover:text-emerald-800"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <Input className="pl-9" placeholder="Search for dishes..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowFilters((isOpen) => !isOpen)}>
              Filters
            </Button>
          </div>

          {showFilters ? (
            <div className="mb-5 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "All", value: "ALL" },
                  { label: "Veg", value: "VEG" },
                  { label: "Non-veg", value: "NON_VEG" },
                  { label: "Egg", value: "EGG" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setFoodTypeFilter(filter.value as "ALL" | CustomerMenuItem["foodType"])}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      foodTypeFilter === filter.value ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOnlyAvailable((value) => !value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    onlyAvailable ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-200"
                  }`}
                >
                  Available only
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyPopular((value) => !value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    onlyPopular ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-200"
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>
          ) : null}

          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{isSearching ? "Searched items" : activeCategory?.name ?? "All"}</h2>
            {isSearching ? <span className="text-sm text-zinc-500">{visibleItems.length} found</span> : null}
          </div>
          {visibleItems.length > 0 ? (
            <div className="grid gap-3">
              {visibleItems.map((item) => {
                const isUnavailable = !item.isAvailable || item.isSoldOut;
                const parsedVariants = parseItemVariants(item.description);
                const displayPrice = getItemDisplayPrice(item.price, item.offerPrice, parsedVariants.portions);

                return (
                  <Card key={item.id} className={`grid items-center gap-4 p-3.5 sm:p-4 rounded-2xl border-zinc-200/80 shadow-sm transition hover:shadow-md ${isPreviewMode ? "grid-cols-[96px_1fr]" : "grid-cols-[96px_1fr_auto]"} ${isUnavailable ? "opacity-60 grayscale-[30%]" : ""}`}>
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/70 shadow-sm">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="food-photo h-full w-full" />
                      )}
                      <div className="absolute top-1.5 left-1.5">
                        <span
                          className={`inline-block h-3 w-3 rounded-full border-2 border-white shadow-sm ${
                            item.foodType === "VEG"
                              ? "bg-emerald-600"
                              : item.foodType === "NON_VEG"
                                ? "bg-rose-600"
                                : "bg-amber-500"
                          }`}
                          title={item.foodType === "NON_VEG" ? "Non-Vegetarian" : item.foodType === "EGG" ? "Contains Egg" : "Vegetarian"}
                        />
                      </div>
                      {item.isPopular ? (
                        <span className="absolute bottom-1 right-1 rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                          Top
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-zinc-950">{item.name}</h3>
                        {parsedVariants.hasPortions ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/80">
                            Customisable
                          </span>
                        ) : null}
                        {isUnavailable ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            {item.isSoldOut ? "Sold out" : "Unavailable"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {parsedVariants.description || "Freshly prepared dish"}
                      </p>
                      <div className="mt-2.5 flex items-center gap-3 text-xs">
                        <span className="text-sm font-black text-zinc-950">
                          {displayPrice}
                        </span>
                        {!parsedVariants.hasPortions && item.offerPrice ? (
                          <span className="text-xs font-semibold text-zinc-400 line-through">
                            {currency.format(item.price)}
                          </span>
                        ) : null}
                        <span className="text-zinc-400">•</span>
                        <span className="font-medium text-zinc-500">{item.preparationTimeMinutes} mins</span>
                      </div>
                    </div>

                    {!isPreviewMode ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUnavailable || (Boolean(placedOrder) && !isAddingMoreItems)}
                        onClick={() => addToCart(item)}
                        className="h-9 px-3.5 text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        {isAddingMoreItems ? "Add more" : "Add"} <Plus className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={menuItems.length > 0 ? "No matching dishes" : "No menu items available"}
              description={menuItems.length > 0 ? "Try another category or search term." : "The restaurant has not published menu items for this table yet."}
            />
          )}
        </div>

        {shouldShowCartPanel ? (
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="grid overflow-hidden rounded-[19px] border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <section className="border-b border-zinc-100">
              <div className="flex h-11 items-center justify-between border-b border-zinc-100 px-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{placedOrder ? "Your order" : "Your cart"}</p>
                  <p className="text-xs text-zinc-400">Table {tableNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-zinc-400" />
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                    onClick={() => setIsCartPanelOpen(false)}
                    aria-label="Close cart"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">Customer name</span>
                  <Input
                    value={customerName}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setCustomerName(nextName);

                      if (nextName.trim().length >= 2) {
                        setShowNamePrompt(false);
                      }
                    }}
                    placeholder="Enter your name"
                    disabled={Boolean(placedOrder)}
                  />
                </label>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Dining guests</p>
                      <p className="mt-1 text-xs text-zinc-500">Choose plates, spoons, or tissues only if you need them.</p>
                    </div>
                    <div className="inline-grid h-9 grid-cols-3 rounded-lg border border-zinc-200 bg-white shadow-sm">
                      <button
                        type="button"
                        className="grid w-9 place-items-center text-zinc-600 disabled:opacity-40"
                        disabled={Boolean(placedOrder) || guestCount <= 1}
                        onClick={() => updateGuestCount(guestCount - 1)}
                        aria-label="Decrease guest count"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="grid w-9 place-items-center text-sm font-black text-zinc-900">{guestCount}</span>
                      <button
                        type="button"
                        className="grid w-9 place-items-center text-zinc-600 disabled:opacity-40"
                        disabled={Boolean(placedOrder) || guestCount >= 30}
                        onClick={() => updateGuestCount(guestCount + 1)}
                        aria-label="Increase guest count"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getGuestServiceOptions(guestCount).map((option) => {
                      const isSelected = selectedOptions.includes(option);

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={Boolean(placedOrder)}
                          onClick={() => toggleQuickOption(option)}
                          className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
                            isSelected
                              ? "border-emerald-700 bg-emerald-700 text-white"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-200 hover:text-emerald-800"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {showNamePrompt && !placedOrder ? (
                  <button type="button" className="name-required-alert" onClick={() => setShowNamePrompt(false)}>
                    <span className="name-required-icon" aria-hidden="true">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <span className="name-required-now">Name</span>
                    <span className="name-required-play">Name required</span>
                  </button>
                ) : null}

                {cartItems.length > 0 ? (
                  <div className="grid gap-3">
                    {cartItems.map((cartItem) => {
                      const itemKey = getCartItemKey(cartItem);
                      const unitPrice = getItemUnitPrice(cartItem);

                      return (
                        <div key={itemKey} className="grid grid-cols-[56px_1fr_auto] gap-3 rounded-xl border border-zinc-100 bg-white p-2.5 shadow-sm">
                          <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Utensils className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-zinc-900">{cartItem.item.name}</p>
                            {cartItem.portion ? (
                              <span className="inline-block mt-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                {cartItem.portion.name} ({currency.format(cartItem.portion.price)})
                              </span>
                            ) : (
                              <p className="mt-0.5 text-xs text-zinc-500">{cartItem.item.categoryName}</p>
                            )}
                            {selectedOptions.length > 0 ? (
                              <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-400">{selectedOptions.join(", ")}</p>
                            ) : null}
                            <div className="mt-2 inline-grid h-8 grid-cols-3 rounded-lg border border-zinc-200 bg-white shadow-xs">
                              <button type="button" className="grid w-8 place-items-center text-zinc-600 disabled:opacity-40" disabled={Boolean(placedOrder)} onClick={() => updateCartQuantity(itemKey, -1)} aria-label={`Decrease ${cartItem.item.name}`}>
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="grid w-7 place-items-center text-sm font-bold text-zinc-800">{cartItem.quantity}</span>
                              <button type="button" className="grid w-8 place-items-center text-zinc-600 disabled:opacity-40" disabled={Boolean(placedOrder)} onClick={() => updateCartQuantity(itemKey, 1)} aria-label={`Increase ${cartItem.item.name}`}>
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between gap-2">
                            <span className="text-sm font-black text-zinc-900">{currency.format(unitPrice * cartItem.quantity)}</span>
                            {!placedOrder ? (
                              <button type="button" className="text-xs font-semibold text-rose-500 hover:text-rose-700" onClick={() => removeFromCart(itemKey)}>
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
                    Add items from the menu to build this table&apos;s cart.
                  </div>
                )}

                {isAddingMoreItems ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-emerald-950">Adding more items</p>
                        <p className="mt-1 text-xs text-emerald-700">Pick more dishes from the menu, then save them into this unpaid order.</p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                        onClick={() => {
                          setIsAddingMoreItems(false);
                          setAddOnCartItems([]);
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    {addOnCartItems.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {addOnCartItems.map((cartItem) => {
                          const itemKey = getCartItemKey(cartItem);
                          const unitPrice = getItemUnitPrice(cartItem);

                          return (
                            <div key={itemKey} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-emerald-100 bg-white p-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-zinc-900">{cartItem.item.name}</p>
                                {cartItem.portion ? (
                                  <span className="inline-block mt-0.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    {cartItem.portion.name} ({currency.format(cartItem.portion.price)})
                                  </span>
                                ) : (
                                  <p className="mt-1 text-xs text-zinc-500">{cartItem.item.categoryName}</p>
                                )}
                                <div className="mt-2 inline-grid h-8 grid-cols-3 rounded-lg border border-zinc-200 bg-white shadow-xs">
                                  <button type="button" className="grid w-8 place-items-center text-zinc-600" onClick={() => updateAddOnCartQuantity(itemKey, -1)} aria-label={`Decrease ${cartItem.item.name}`}>
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="grid w-7 place-items-center text-sm font-bold text-zinc-800">{cartItem.quantity}</span>
                                  <button type="button" className="grid w-8 place-items-center text-zinc-600" onClick={() => updateAddOnCartQuantity(itemKey, 1)} aria-label={`Increase ${cartItem.item.name}`}>
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col items-end justify-between">
                                <span className="text-sm font-black text-zinc-900">{currency.format(unitPrice * cartItem.quantity)}</span>
                                <button type="button" className="text-xs font-semibold text-rose-500 hover:text-rose-700" onClick={() => removeFromAddOnCart(itemKey)}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900">
                          <span>Add-on total</span>
                          <span>{currency.format(addOnTotal)}</span>
                        </div>
                        <Button type="button" className="w-full" disabled={!canSaveAddOnItems} onClick={saveAddOnItems}>
                          {isSavingAddOnItems ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Save added items
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-emerald-200 bg-white/70 p-3 text-xs text-emerald-700">
                        Your add-on cart is empty. Tap `Add more` on any available menu item.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="border-b border-zinc-100">
              <div className="flex h-10 items-center border-b border-zinc-100 px-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Order details</p>
              </div>
              <div className="p-3">
                <p className="mb-2 text-xs font-semibold text-zinc-500">Quick options</p>
                <div className="flex flex-wrap gap-2">
                  {quickOptions.map((option) => {
                    const isSelected = selectedOptions.includes(option);

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={Boolean(placedOrder)}
                        onClick={() => toggleQuickOption(option)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
                          isSelected ? "border-emerald-700 bg-emerald-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-emerald-200 hover:text-emerald-800"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section>
              <div className="flex h-10 items-center border-b border-zinc-100 px-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Bill Breakdown</p>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 p-3.5 text-sm">
                <span className="text-xs font-bold text-zinc-500">
                  {placedOrder ? "Order Total:" : "Items Subtotal:"}
                </span>
                <span className="text-sm font-semibold text-zinc-800">
                  {currency.format(placedOrder ? placedOrder.total : cartSubtotal)}
                </span>

                {!placedOrder && taxRatePercent > 0 ? (
                  <>
                    <span className="text-xs font-bold text-zinc-500">GST / Taxes ({taxRatePercent}%):</span>
                    <span className="text-sm font-semibold text-zinc-800">+{currency.format(cartTax)}</span>
                  </>
                ) : null}

                {placedOrder && addOnCartItems.length > 0 ? (
                  <>
                    <span className="text-xs font-bold text-zinc-500">Unsaved Add-ons (incl. tax):</span>
                    <span className="text-sm font-semibold text-emerald-700">+{currency.format(addOnTotal)}</span>
                  </>
                ) : null}

                <div className="col-span-2 my-1 border-t border-zinc-100" />
                <span className="text-sm font-black text-zinc-950">Grand Total (To Pay):</span>
                <span className="text-base font-black text-emerald-700">{currency.format(payableTotal)}</span>
              </div>

              {placedOrder ? (
                <div className="mx-3 mb-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Order placed</p>
                      <p className="mt-1 text-xs text-emerald-700">#{placedOrder.orderNumber}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800">{formatOrderStatus(placedOrder.status)}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-emerald-800">
                    <div className="flex justify-between"><span>Guests</span><span>{guestCount}</span></div>
                    <div className="flex justify-between"><span>Restaurant acceptance</span><span>{placedOrder.status === "PENDING" ? "Waiting" : formatOrderStatus(placedOrder.status)}</span></div>
                    <div className="flex justify-between"><span>Service flow</span><span>{getCustomerOrderStage(placedOrder.status)}</span></div>
                    <div className="flex justify-between"><span>Payment</span><span>{formatPaymentStatus(placedOrder.paymentStatus)}</span></div>
                  </div>
                  {canAddMoreItems ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full border-emerald-200 bg-white text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
                      onClick={() => setIsAddingMoreItems(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add more items
                    </Button>
                  ) : placedOrder.paymentStatus === "PAID" ? (
                    <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-emerald-800">
                      Payment is complete. Scan the table QR again to add items or reorder.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {placedOrder && placedOrder.paymentStatus !== "PAID" && orderIsServed ? (
                <div className="mx-3 mb-3 rounded-xl border border-zinc-200 p-3">
                  <h3 className="text-sm font-semibold">Payment option</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {isAddingMoreItems ? "Save added items before choosing payment." : "Choose a method after placing the order. Restaurant will verify the payment."}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" disabled={isRequestingPayment || isAddingMoreItems} onClick={() => requestPayment("CASH")}>
                      Cash
                    </Button>
                    <Button type="button" variant="secondary" disabled={isRequestingPayment || isAddingMoreItems || !upiId} onClick={() => requestPayment("UPI")}>
                      {isRequestingPayment && selectedPaymentMethod === "UPI" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      UPI
                    </Button>
                  </div>
                  {!upiId ? <p className="mt-2 text-xs text-rose-500">UPI is not configured by this restaurant yet.</p> : null}
                  {paymentMessage ? <p className="mt-2 text-xs text-zinc-500">{paymentMessage}</p> : null}
                </div>
              ) : null}

              {placedOrder?.paymentStatus === "PAID" ? (
                <div className="mx-3 mb-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <p className="font-semibold text-emerald-900">Thank you, {customerName}!</p>
                  <p className="mt-1 text-sm text-emerald-700">Your payment has been confirmed by the restaurant.</p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 bg-zinc-100 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Total</p>
                  <p className="text-2xl font-black text-zinc-900">{currency.format(payableTotal)}</p>
                </div>
                <Button
                  type="button"
                  variant="glass"
                  className="min-w-36 border-emerald-300/30 bg-emerald-800/50 hover:border-black hover:bg-black hover:text-white"
                  disabled={!canAttemptOrder}
                  onClick={placeOrder}
                >
                  {isPlacingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {placedOrder ? "Order Placed" : "Place Order"}
                </Button>
              </div>
            </section>
          </div>
        </aside>
        ) : null}
      </section>

      {hasCartActivity && !shouldShowCartPanel ? (
        <button
          type="button"
          className="fixed bottom-4 left-4 right-4 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl border border-emerald-200/30 bg-emerald-800 px-4 py-3 text-white shadow-2xl shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:bg-emerald-950 lg:left-auto lg:right-6 lg:max-w-sm"
          onClick={() => setIsCartPanelOpen(true)}
          aria-label={placedOrder ? "Open order details" : "Open cart"}
        >
          <span className="inline-flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-emerald-900">
                  {cartItemCount}
                </span>
              ) : null}
            </span>
            <span className="text-left">
              <span className="block text-sm font-black">{placedOrder ? "View order" : "View cart"}</span>
              <span className="block text-xs font-medium text-emerald-100">
                {placedOrder ? formatOrderStatus(placedOrder.status) : `${cartItemCount} item${cartItemCount === 1 ? "" : "s"} added`}
              </span>
            </span>
          </span>
          <span className="text-sm font-black">{currency.format(payableTotal)}</span>
        </button>
      ) : null}

      {/* Portion / Size Selector Modal */}
      {portionModalItem ? (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-zinc-950/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl border border-zinc-200 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      portionModalItem.item.foodType === "VEG"
                        ? "bg-emerald-600"
                        : portionModalItem.item.foodType === "NON_VEG"
                          ? "bg-rose-600"
                          : "bg-amber-500"
                    }`}
                  />
                  <h3 className="truncate text-base font-bold text-zinc-950">{portionModalItem.item.name}</h3>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">Choose portion size for your table</p>
              </div>
              <button
                type="button"
                onClick={() => setPortionModalItem(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Select Portion Size</p>
              <div className="grid gap-2">
                {portionModalItem.portions.map((portion) => {
                  const isSelected = portionModalItem.selectedPortion.name === portion.name;
                  return (
                    <div
                      key={portion.name}
                      onClick={() =>
                        setPortionModalItem((current) =>
                          current ? { ...current, selectedPortion: portion } : null
                        )
                      }
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-4 w-4 place-items-center rounded-full border ${
                            isSelected ? "border-emerald-600 bg-emerald-600" : "border-zinc-300"
                          }`}
                        >
                          {isSelected ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                        </div>
                        <span className="text-sm font-bold text-zinc-900">{portion.name}</span>
                      </div>
                      <span className="text-sm font-black text-zinc-950">{currency.format(portion.price)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                <span className="text-xs font-bold text-zinc-600">Quantity</span>
                <div className="inline-grid h-8 grid-cols-3 rounded-lg border border-zinc-200 bg-white shadow-xs">
                  <button
                    type="button"
                    className="grid w-8 place-items-center text-zinc-600 disabled:opacity-40"
                    disabled={portionModalItem.quantity <= 1}
                    onClick={() =>
                      setPortionModalItem((current) =>
                        current ? { ...current, quantity: Math.max(1, current.quantity - 1) } : null
                      )
                    }
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="grid w-8 place-items-center text-sm font-bold text-zinc-900">
                    {portionModalItem.quantity}
                  </span>
                  <button
                    type="button"
                    className="grid w-8 place-items-center text-zinc-600 disabled:opacity-40"
                    disabled={portionModalItem.quantity >= 20}
                    onClick={() =>
                      setPortionModalItem((current) =>
                        current ? { ...current, quantity: Math.min(20, current.quantity + 1) } : null
                      )
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Button
                type="button"
                className="w-full bg-emerald-700 font-bold text-white hover:bg-emerald-800 h-11 text-sm shadow-md"
                onClick={() =>
                  addPortionToCart(
                    portionModalItem.item,
                    portionModalItem.selectedPortion,
                    portionModalItem.quantity
                  )
                }
              >
                Add to Cart · {currency.format(portionModalItem.selectedPortion.price * portionModalItem.quantity)}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function formatOrderStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPaymentStatus(status: string) {
  if (status === "VERIFICATION_PENDING") {
    return "Waiting for confirmation";
  }

  return formatOrderStatus(status);
}

function getCustomerOrderStage(status: string) {
  if (status === "PENDING") return "Waiting for admin";
  if (status === "ACCEPTED") return "Sent to kitchen";
  if (status === "PREPARING") return "Being prepared";
  if (status === "READY") return "Waiting for waiter";
  if (status === "SERVED") return "Served";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";

  return formatOrderStatus(status);
}

function createUpiUrl({
  upiId,
  payeeName,
  amount,
  note,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
}
