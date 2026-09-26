"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  ListOrdered,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Utensils,
  XCircle,
} from "lucide-react";
import type { DashboardSearchResults, SearchedDishResult } from "@/lib/dashboard-search";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ACCEPTED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  PREPARING: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  READY: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SERVED: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  COMPLETED: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200" },
  CANCELLED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export function SearchResultsClient({ initialResults }: { initialResults: DashboardSearchResults }) {
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(initialResults.query);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!queryInput.trim()) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(queryInput.trim())}`);
  }

  const hasDishes = initialResults.dishes.length > 0;
  const hasOrders = initialResults.orders.length > 0;
  const hasAnyResults = hasDishes || hasOrders;

  return (
    <div className="space-y-8">
      {/* Search Header Bar */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search dish (e.g. Biryani, Paneer), customer name, or order #..."
              className="w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50/50 pl-11 pr-4 text-sm font-medium text-zinc-900 placeholder-zinc-400 transition focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto h-11 rounded-2xl bg-rose-600 px-6 text-sm font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Search className="h-4 w-4 stroke-[2.5]" />
            <span>Search</span>
          </button>
        </form>

        {initialResults.query && (
          <div className="mt-3.5 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500">
            <span>
              Showing results for: <strong className="text-zinc-900 font-bold">&quot;{initialResults.query}&quot;</strong>
            </span>
            <Link
              href="/dashboard"
              prefetch={false}
              className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Overview
            </Link>
          </div>
        )}
      </div>

      {/* No query provided */}
      {!initialResults.query && (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/50 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-zinc-900">Search Dishes & Customer Order History</h2>
          <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
            Type a dish name (e.g. &quot;Biryani&quot;, &quot;Paneer Butter Masala&quot;) to see dish details and who ordered it across all tables.
          </p>
        </div>
      )}

      {/* No results found */}
      {initialResults.query && !hasAnyResults && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-4">
            <Utensils className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-zinc-900">No matching dish or orders found</h2>
          <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
            We couldn&apos;t find any dish or customer order matching &quot;{initialResults.query}&quot;. Please check the spelling or try searching another item.
          </p>
        </div>
      )}

      {/* 1. Matching Dish Details & Customer Orders Breakdown */}
      {hasDishes && (
        <div className="space-y-10">
          {initialResults.dishes.map((dish) => (
            <DishSearchResultSection key={dish.id} dish={dish} />
          ))}
        </div>
      )}

      {/* 2. Direct Matching Orders (if search matched order number/customer name directly) */}
      {!hasDishes && hasOrders && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-rose-600" />
            <h2 className="text-base font-bold text-zinc-900">Matching Orders ({initialResults.orders.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialResults.orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-xs font-black text-rose-600 uppercase tracking-wider">{order.orderNumber}</span>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                      {order.customerName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-800">
                      {order.tableNumber}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-700">
                      <span>
                        <strong className="text-zinc-900 font-bold">{item.quantity}x</strong> {item.name}
                      </span>
                      <span className="font-semibold">₹{item.total}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                  <span className="font-bold text-zinc-900">Total: ₹{order.total}</span>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                    statusStyles[order.status]?.bg ?? "bg-zinc-50",
                    statusStyles[order.status]?.text ?? "text-zinc-700",
                    statusStyles[order.status]?.border ?? "border-zinc-200"
                  )}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DishSearchResultSection({ dish }: { dish: SearchedDishResult }) {
  const isVeg = dish.foodType === "VEG";
  const isEgg = dish.foodType === "EGG";

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-xs">
      {/* Upper Part: Dish Information Card */}
      <div className="bg-gradient-to-br from-zinc-50/80 via-white to-rose-50/20 p-6 border-b border-zinc-200/80">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Dish Image or Food Type Badge */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs flex items-center justify-center">
              {dish.imageUrl ? (
                <Image
                  src={dish.imageUrl}
                  alt={dish.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className={cn(
                  "flex h-full w-full items-center justify-center font-black text-lg",
                  isVeg ? "bg-emerald-50 text-emerald-700" : isEgg ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                )}>
                  {isVeg ? "🌱" : isEgg ? "🥚" : "🍗"}
                </div>
              )}
            </div>

            {/* Dish Header Meta */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Veg/Non-Veg Tag */}
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border",
                  isVeg
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : isEgg
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", isVeg ? "bg-emerald-600" : isEgg ? "bg-amber-600" : "bg-rose-600")} />
                  {dish.foodType}
                </span>

                {/* Category Badge */}
                <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                  <Layers className="h-2.5 w-2.5 text-zinc-400" />
                  {dish.categoryName}
                </span>

                {/* Popular Badge */}
                {dish.isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    Popular
                  </span>
                )}

                {/* Availability Badge */}
                {dish.isSoldOut ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    <XCircle className="h-2.5 w-2.5" />
                    Sold Out
                  </span>
                ) : dish.isAvailable ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                    Inactive
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-black tracking-tight text-zinc-950">{dish.name}</h2>
              {dish.description && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2 max-w-xl leading-relaxed">{dish.description}</p>
              )}

              {/* Pricing & Prep Time */}
              <div className="mt-2.5 flex items-center gap-4 text-xs">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-zinc-950">
                    ₹{dish.offerPrice ?? dish.price}
                  </span>
                  {dish.offerPrice && dish.offerPrice < dish.price && (
                    <span className="text-xs text-zinc-400 line-through font-semibold">
                      ₹{dish.price}
                    </span>
                  )}
                </div>
                {dish.preparationTimeMinutes > 0 && (
                  <span className="flex items-center gap-1 text-zinc-500 font-medium text-[11px]">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    {dish.preparationTimeMinutes} mins prep
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Aggregated Real Metric Cards for this Dish */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 text-center min-w-[95px]">
              <div className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Orders
              </div>
              <p className="mt-1 text-lg font-black text-rose-950">{dish.stats.totalQuantityOrdered}</p>
              <p className="text-[10px] text-rose-600/80 font-medium">plates ordered</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-center min-w-[95px]">
              <div className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                <IndianRupee className="h-3 w-3" />
                Revenue
              </div>
              <p className="mt-1 text-lg font-black text-emerald-950">₹{dish.stats.totalRevenue}</p>
              <p className="text-[10px] text-emerald-600/80 font-medium">total sales</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-center min-w-[95px]">
              <div className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1">
                <Utensils className="h-3 w-3" />
                Tables
              </div>
              <p className="mt-1 text-lg font-black text-blue-950">{dish.stats.uniqueOrdersCount}</p>
              <p className="text-[10px] text-blue-600/80 font-medium">unique orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Part: Who Ordered This Dish Breakdown */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-rose-600" />
              Customer Order History &amp; Breakdown (Kisne kisne &amp; kitni bar mangai)
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Detailed breakdown of recent table orders containing {dish.name}
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
            {dish.orders.length} {dish.orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>

        {dish.orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
            <p className="text-xs font-semibold text-zinc-600">No customer has ordered {dish.name} in recent history.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">When guests order this dish via QR code or staff, order details will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Customer / Guest</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3">Item Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dish.orders.map((order, idx) => {
                  const style = statusStyles[order.orderStatus] ?? { bg: "bg-zinc-50", text: "text-zinc-700", border: "border-zinc-200" };
                  return (
                    <tr key={`${order.orderId}-${idx}`} className="transition hover:bg-zinc-50/60">
                      {/* Customer Name */}
                      <td className="px-4 py-3.5 font-bold text-zinc-900">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <User className="h-3 w-3" />
                          </div>
                          <span>{order.customerName}</span>
                        </div>
                      </td>

                      {/* Table Number */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-800">
                          {order.tableNumber}
                        </span>
                      </td>

                      {/* Order Number */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-rose-600">
                          {order.orderNumber}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center rounded-lg bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-700 border border-rose-100">
                          {order.quantity}x
                        </span>
                      </td>

                      {/* Item Total */}
                      <td className="px-4 py-3.5 font-bold text-zinc-900">
                        ₹{order.itemTotal}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                          style.bg,
                          style.text,
                          style.border
                        )}>
                          {order.orderStatus}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-zinc-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    return `${dateStr}, ${timeStr}`;
  } catch {
    return isoString;
  }
}
