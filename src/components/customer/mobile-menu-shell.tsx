"use client";

import { Loader2, Minus, Plus, Search, ShoppingCart, UserRound, Utensils } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

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
  tableNumber: string;
  categories: CustomerMenuCategory[];
  menuItems: CustomerMenuItem[];
  mode?: "ordering" | "preview";
};

type CartItem = {
  item: CustomerMenuItem;
  quantity: number;
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
  maximumFractionDigits: 0,
});
const quickOptions = ["Less Spicy", "Extra Cheese", "Extra Plate", "Extra Spoon", "Extra Tissue", "Serve Together"];

function getGuestServiceOptions(guestCount: number) {
  return [`${guestCount} Plates`, `${guestCount} Spoons`, `${guestCount} Tissues`];
}

export function MobileMenuShell({ restaurantSlug, restaurantName, upiId, upiDisplayName, tableNumber, categories, menuItems, mode = "ordering" }: MobileMenuShellProps) {
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
  const [guestCount, setGuestCount] = useState(2);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [addOnCartItems, setAddOnCartItems] = useState<CartItem[]>([]);
  const [isAddingMoreItems, setIsAddingMoreItems] = useState(false);
  const [isSavingAddOnItems, setIsSavingAddOnItems] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

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
  const cartSubtotal = cartItems.reduce((total, cartItem) => total + cartItem.item.price * cartItem.quantity, 0);
  const cartDiscount = cartItems.reduce((total, cartItem) => {
    const effectivePrice = cartItem.item.offerPrice ?? cartItem.item.price;
    return total + (cartItem.item.price - effectivePrice) * cartItem.quantity;
  }, 0);
  const cartTotal = cartSubtotal - cartDiscount;
  const addOnSubtotal = addOnCartItems.reduce((total, cartItem) => total + cartItem.item.price * cartItem.quantity, 0);
  const addOnDiscount = addOnCartItems.reduce((total, cartItem) => {
    const effectivePrice = cartItem.item.offerPrice ?? cartItem.item.price;
    return total + (cartItem.item.price - effectivePrice) * cartItem.quantity;
  }, 0);
  const addOnTotal = addOnSubtotal - addOnDiscount;
  const payableTotal = placedOrder ? placedOrder.total : cartTotal;
  const canPlaceOrder = cartItems.length > 0 && customerName.trim().length >= 2 && guestCount >= 1 && guestCount <= 30 && !placedOrder;
  const canAttemptOrder = cartItems.length > 0 && !placedOrder && !isPlacingOrder;
  const canAddMoreItems = placedOrder?.paymentStatus === "UNPAID";
  const canSaveAddOnItems = canAddMoreItems && addOnCartItems.length > 0 && !isSavingAddOnItems;

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
    const setTargetCartItems = placedOrder && isAddingMoreItems ? setAddOnCartItems : setCartItems;

    setTargetCartItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.item.id === item.id);

      if (existingItem) {
        return currentItems.map((cartItem) => (
          cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        ));
      }

      return [...currentItems, { item, quantity: 1 }];
    });
  }

  function updateCartItemsQuantity(setTargetCartItems: Dispatch<SetStateAction<CartItem[]>>, itemId: string, change: number) {
    setTargetCartItems((currentItems) => (
      currentItems
        .map((cartItem) => (
          cartItem.item.id === itemId ? { ...cartItem, quantity: cartItem.quantity + change } : cartItem
        ))
        .filter((cartItem) => cartItem.quantity > 0)
    ));
  }

  function updateCartQuantity(itemId: string, change: number) {
    updateCartItemsQuantity(setCartItems, itemId, change);
  }

  function updateAddOnCartQuantity(itemId: string, change: number) {
    updateCartItemsQuantity(setAddOnCartItems, itemId, change);
  }

  function removeFromCart(itemId: string) {
    setCartItems((currentItems) => currentItems.filter((cartItem) => cartItem.item.id !== itemId));
  }

  function removeFromAddOnCart(itemId: string) {
    setAddOnCartItems((currentItems) => currentItems.filter((cartItem) => cartItem.item.id !== itemId));
  }

  function mergeCartItems(baseItems: CartItem[], newItems: CartItem[]) {
    return newItems.reduce<CartItem[]>((mergedItems, newItem) => {
      const existingItem = mergedItems.find((cartItem) => cartItem.item.id === newItem.item.id);

      if (!existingItem) {
        return [...mergedItems, newItem];
      }

      return mergedItems.map((cartItem) => (
        cartItem.item.id === newItem.item.id ? { ...cartItem, quantity: cartItem.quantity + newItem.quantity } : cartItem
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
          options: selectedOptions,
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
          options: selectedOptions,
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

      <section className={`mx-auto grid gap-4 px-4 py-4 ${isPreviewMode ? "max-w-5xl" : "max-w-7xl lg:grid-cols-[1fr_360px]"}`}>
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

                return (
                  <Card key={item.id} className={`grid items-center gap-4 p-3 ${isPreviewMode ? "grid-cols-[92px_1fr]" : "grid-cols-[92px_1fr_auto]"} ${isUnavailable ? "opacity-65" : ""}`}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-20 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="food-photo h-20 rounded-lg" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{item.name}</h3>
                        <span className={`rounded border px-1 text-[10px] ${item.foodType === "NON_VEG" ? "border-rose-200 text-rose-700" : "border-emerald-200 text-emerald-700"}`}>
                          {item.foodType === "NON_VEG" ? "non-veg" : item.foodType.toLowerCase()}
                        </span>
                        {item.isPopular ? <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Popular</span> : null}
                        {isUnavailable ? <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">{item.isSoldOut ? "Sold out" : "Unavailable"}</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{item.description ?? "Restaurant menu item"}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-800">{currency.format(item.offerPrice ?? item.price)}</span>
                        {item.offerPrice ? <span className="line-through">{currency.format(item.price)}</span> : null}
                        <span>{item.preparationTimeMinutes} min</span>
                      </div>
                    </div>
                    {!isPreviewMode ? (
                      <Button type="button" variant="secondary" size="sm" disabled={isUnavailable || (Boolean(placedOrder) && !isAddingMoreItems)} onClick={() => addToCart(item)}>
                        {isAddingMoreItems ? "Add more" : "Add"} <Plus className="h-3 w-3" />
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

        {!isPreviewMode ? (
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="grid overflow-hidden rounded-[19px] border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <section className="border-b border-zinc-100">
              <div className="flex h-11 items-center justify-between border-b border-zinc-100 px-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{placedOrder ? "Your order" : "Your cart"}</p>
                  <p className="text-xs text-zinc-400">Table {tableNumber}</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-zinc-400" />
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
                    <span className="name-required-play">Required</span>
                  </button>
                ) : null}

                {cartItems.length > 0 ? (
                  <div className="grid gap-3">
                    {cartItems.map((cartItem) => (
                      <div key={cartItem.item.id} className="grid grid-cols-[56px_1fr_auto] gap-3 rounded-xl border border-zinc-100 bg-white p-2 shadow-sm">
                        <div className="grid h-14 w-14 place-items-center rounded-xl bg-orange-50 text-orange-500">
                          <Utensils className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-800">{cartItem.item.name}</p>
                          <p className="mt-1 text-xs font-medium text-zinc-500">{cartItem.item.categoryName}</p>
                          {selectedOptions.length > 0 ? (
                            <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-400">{selectedOptions.join(", ")}</p>
                          ) : null}
                          <div className="mt-2 inline-grid h-8 grid-cols-3 rounded-lg border border-zinc-200 bg-white shadow-sm">
                            <button type="button" className="grid w-8 place-items-center text-zinc-600 disabled:opacity-40" disabled={Boolean(placedOrder)} onClick={() => updateCartQuantity(cartItem.item.id, -1)} aria-label={`Decrease ${cartItem.item.name}`}>
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="grid w-7 place-items-center text-sm font-bold text-zinc-800">{cartItem.quantity}</span>
                            <button type="button" className="grid w-8 place-items-center text-zinc-600 disabled:opacity-40" disabled={Boolean(placedOrder)} onClick={() => updateCartQuantity(cartItem.item.id, 1)} aria-label={`Increase ${cartItem.item.name}`}>
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-2">
                          <span className="text-sm font-black text-zinc-900">{currency.format((cartItem.item.offerPrice ?? cartItem.item.price) * cartItem.quantity)}</span>
                          {!placedOrder ? (
                            <button type="button" className="text-xs font-medium text-rose-500 hover:text-rose-700" onClick={() => removeFromCart(cartItem.item.id)}>
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
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
                        {addOnCartItems.map((cartItem) => (
                          <div key={cartItem.item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-emerald-100 bg-white p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900">{cartItem.item.name}</p>
                              <p className="mt-1 text-xs text-zinc-500">{cartItem.item.categoryName}</p>
                              <div className="mt-2 inline-grid h-8 grid-cols-3 rounded-lg border border-zinc-200 bg-white shadow-sm">
                                <button type="button" className="grid w-8 place-items-center text-zinc-600" onClick={() => updateAddOnCartQuantity(cartItem.item.id, -1)} aria-label={`Decrease ${cartItem.item.name}`}>
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="grid w-7 place-items-center text-sm font-bold text-zinc-800">{cartItem.quantity}</span>
                                <button type="button" className="grid w-8 place-items-center text-zinc-600" onClick={() => updateAddOnCartQuantity(cartItem.item.id, 1)} aria-label={`Increase ${cartItem.item.name}`}>
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <span className="text-sm font-black text-zinc-900">{currency.format((cartItem.item.offerPrice ?? cartItem.item.price) * cartItem.quantity)}</span>
                              <button type="button" className="text-xs font-medium text-rose-500 hover:text-rose-700" onClick={() => removeFromAddOnCart(cartItem.item.id)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
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
                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Checkout</p>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 p-3 text-sm">
                <span className="text-xs font-bold text-zinc-500">{placedOrder ? "Current order total:" : "Your cart subtotal:"}</span>
                <span className="text-sm font-semibold text-zinc-800">{currency.format(placedOrder ? placedOrder.total : cartSubtotal)}</span>
                <span className="text-xs font-bold text-zinc-500">{placedOrder ? "Unsaved add-ons:" : "Offer discount:"}</span>
                <span className="text-sm font-semibold text-emerald-700">{placedOrder ? currency.format(addOnTotal) : `-${currency.format(cartDiscount)}`}</span>
                <span className="text-xs font-bold text-zinc-500">Tax:</span>
                <span className="text-sm font-semibold text-zinc-800">{currency.format(0)}</span>
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

              {placedOrder && placedOrder.paymentStatus !== "PAID" ? (
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
