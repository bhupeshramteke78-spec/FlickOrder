"use client";

import { CalendarDays, Clock, CreditCard, IndianRupee, Search, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OrderStatus, PaymentStatus } from "@/lib/database.types";

type HistoryRange = "today" | "yesterday" | "7days" | "30days";

export type OrderHistoryExplorerRow = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    options: string[];
  }>;
};

const rangeOptions: Array<{ value: HistoryRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "7 days" },
  { value: "30days", label: "30 days" },
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function OrderHistoryExplorer({ orders, canUseAdvancedSearch }: { orders: OrderHistoryExplorerRow[]; canUseAdvancedSearch: boolean }) {
  const [range, setRange] = useState<HistoryRange>("today");
  const [query, setQuery] = useState("");
  const availableRangeOptions = canUseAdvancedSearch ? rangeOptions : rangeOptions.filter((option) => option.value === "today");

  const filteredOrders = useMemo(() => {
    const { start, end } = getRangeBounds(range);
    const normalizedQuery = canUseAdvancedSearch ? query.trim().toLowerCase() : "";

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const isInRange = createdAt >= start && createdAt < end;

      if (!isInRange) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        order.id,
        order.orderNumber,
        order.tableNumber,
        order.customerName,
        order.status,
        order.paymentStatus,
        String(order.total),
        ...order.items.flatMap((item) => [item.name, String(item.quantity), ...item.options]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [canUseAdvancedSearch, orders, query, range]);

  const groupedOrders = useMemo(() => {
    const groups = new Map<string, OrderHistoryExplorerRow[]>();

    for (const order of filteredOrders) {
      const key = formatDateGroup(order.createdAt);
      const groupOrders = groups.get(key) ?? [];
      groupOrders.push(order);
      groups.set(key, groupOrders);
    }

    return Array.from(groups.entries());
  }, [filteredOrders]);

  return (
    <Card className="mt-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Searchable records</p>
          <h2 className="text-xl font-semibold text-zinc-950">Order history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {canUseAdvancedSearch ? "Search by customer name, order ID, table, item, status, or amount." : "Growth includes today's order records. Upgrade to Pro for search and custom date ranges."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {canUseAdvancedSearch ? <div className="relative min-w-0 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search orders"
            />
          </div> : null}
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {availableRangeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={range === option.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <CalendarDays className="h-4 w-4 text-emerald-700" />
            {rangeOptions.find((option) => option.value === range)?.label}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
            {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
          </span>
        </div>

        {groupedOrders.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {groupedOrders.map(([dateLabel, groupOrders]) => (
              <section key={dateLabel} className="grid gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{dateLabel}</h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  {groupOrders.map((order) => (
                    <HistoryCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-zinc-950">No matching orders</p>
            <p className="mt-1 text-sm text-zinc-500">Try another date range or search term.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function HistoryCard({ order }: { order: OrderHistoryExplorerRow }) {
  const itemSummary = order.items.map((item) => `${item.quantity} x ${item.name}`).join(", ");

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">{order.customerName}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">#{order.orderNumber}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone={order.status === "CANCELLED" ? "danger" : "success"}>{formatStatus(order.status)}</Badge>
          <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>{formatStatus(order.paymentStatus)}</Badge>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-zinc-600">{itemSummary || "No items"}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Table2 className="h-3.5 w-3.5" />
          Table {order.tableNumber}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(order.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-zinc-950">
          <IndianRupee className="h-3.5 w-3.5" />
          {currency.format(order.total)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
        <CreditCard className="h-3.5 w-3.5" />
        {formatStatus(order.paymentStatus)}
      </div>
    </article>
  );
}

function getRangeBounds(range: HistoryRange) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (range === "yesterday") {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    return { start: yesterdayStart, end: todayStart };
  }

  if (range === "7days") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 6);

    return { start, end: new Date(now.getTime() + 1) };
  }

  if (range === "30days") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 29);

    return { start, end: new Date(now.getTime() + 1) };
  }

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return { start: todayStart, end: tomorrowStart };
}

function formatDateGroup(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
