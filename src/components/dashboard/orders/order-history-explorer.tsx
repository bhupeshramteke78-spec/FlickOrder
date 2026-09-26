"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Receipt,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OrderStatus, PaymentStatus } from "@/lib/database.types";
import { formatCurrency } from "@/lib/utils";

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

export function OrderHistoryExplorer({
  orders,
  canUseAdvancedSearch: _canUseAdvancedSearch,
}: {
  orders: OrderHistoryExplorerRow[];
  canUseAdvancedSearch?: boolean;
}) {
  const [range, setRange] = useState<HistoryRange>("today");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = useMemo(() => {
    const { start, end } = getRangeBounds(range);
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const isInRange = createdAt >= start && createdAt < end;

      if (!isInRange) {
        return false;
      }

      if (statusFilter !== "ALL" && order.status !== statusFilter) {
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
        ...order.items.flatMap((item) => [item.name, String(item.quantity)]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [orders, query, range, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function exportCsv() {
    const headers = ["Order ID", "Table", "Date", "Items", "Amount", "Status", "Payment"];
    const rows = filteredOrders.map((o) => [
      `#DF-${o.orderNumber}`,
      `Table ${o.tableNumber}`,
      formatDateTime(o.createdAt),
      o.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
      o.total,
      o.status,
      o.paymentStatus,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `order-history-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  }

  return (
    <div className="space-y-6">
      {/* Header Bar matching Page 8 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Order History</h2>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">
            Review all past transactions and closed orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 gap-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            Filter
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={exportCsv}
            className="h-9 gap-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Table Card matching DineFlow Page 8 */}
      <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        {/* Search & Filter Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Order ID or Table..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-3 text-xs text-zinc-800 placeholder-zinc-400 transition focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-rose-400"
            >
              <option value="ALL">Status: All</option>
              <option value="SERVED">Status: Completed</option>
              <option value="CANCELLED">Status: Cancelled</option>
              <option value="PENDING">Status: Pending</option>
            </select>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value as HistoryRange)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 outline-none focus:border-rose-400"
            >
              <option value="today">Date: Today</option>
              <option value="yesterday">Date: Yesterday</option>
              <option value="7days">Date: Last 7 Days</option>
              <option value="30days">Date: Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Table matching Page 8 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-3.5 font-semibold">ORDER ID</th>
                <th className="pb-3.5 font-semibold">TABLE</th>
                <th className="pb-3.5 font-semibold">DATE & TIME</th>
                <th className="pb-3.5 font-semibold">ITEMS</th>
                <th className="pb-3.5 font-semibold">AMOUNT</th>
                <th className="pb-3.5 font-semibold">STATUS</th>
                <th className="pb-3.5 text-right font-semibold">RECEIPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 font-medium">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const isCancelled = order.status === "CANCELLED";

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-4 font-bold text-zinc-950">#DF-{order.orderNumber}</td>
                      <td className="py-4 text-zinc-700 font-semibold">Table {order.tableNumber}</td>
                      <td className="py-4">
                        <p className="font-semibold text-zinc-900 leading-tight">{formatDate(order.createdAt)}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{formatTime(order.createdAt)}</p>
                      </td>
                      <td className="py-4 max-w-xs">
                        <p className="font-bold text-zinc-900 leading-tight">
                          {order.items.reduce((sum, it) => sum + it.quantity, 0)} Items
                        </p>
                        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                          {order.items.map((it) => it.name).join(", ")}
                        </p>
                      </td>
                      <td className="py-4 font-black text-zinc-950">{formatCurrency(order.total)}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            isCancelled
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isCancelled ? "CANCELLED" : "COMPLETED"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition"
                          title="Print Receipt"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-medium text-zinc-400">
                    No orders matching your selected date and search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching Page 8 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-100 pt-4 text-xs font-medium text-zinc-500">
          <p>
            Showing {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: Math.min(3, totalPages) }, (_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition ${
                    isActive ? "bg-rose-600 text-white shadow-sm" : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function getRangeBounds(range: HistoryRange) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "yesterday") {
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "7days") {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  start.setDate(now.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
