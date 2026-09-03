"use client";

import { Clock, IndianRupee, Table2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type OrderHistoryRow = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    options: string[];
  }>;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function OrderHistoryList({ orders }: { orders: OrderHistoryRow[] }) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      {orders.map((order) => {
        const isOpen = openOrderId === order.id;
        const firstItem = order.items[0];
        const extraItemCount = Math.max(order.items.length - 1, 0);
        const itemSummary = firstItem ? `${firstItem.quantity} x ${firstItem.name}` : "No items";

        return (
          <div key={order.id} className="relative">
            {isOpen ? (
              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-10 rounded-lg border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-950/15 xl:bottom-auto xl:left-auto xl:right-[calc(100%+12px)] xl:top-0 xl:w-80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{order.customerName}</p>
                    <p className="mt-1 text-xs text-zinc-500">#{order.orderNumber} · Table {order.tableNumber}</p>
                  </div>
                  <button type="button" className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" onClick={() => setOpenOrderId(null)} aria-label="Close order details">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-md bg-zinc-50 p-2 text-xs">
                      <p className="font-medium text-zinc-800">{item.quantity} x {item.name}</p>
                      {item.options.length > 0 ? <p className="mt-1 text-zinc-500">{item.options.join(", ")}</p> : null}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(order.createdAt)}</span>
                  <span className="font-semibold text-zinc-950">{currency.format(order.total)}</span>
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              className="h-auto w-full justify-start p-3 text-left"
              onClick={() => setOpenOrderId(isOpen ? null : order.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-zinc-950">{order.customerName}</span>
                <span className="mt-1 block truncate text-xs text-zinc-500">{itemSummary}</span>
                {extraItemCount > 0 ? (
                  <span className="mt-1 block text-xs font-medium text-zinc-400">
                    +{extraItemCount} more item{extraItemCount === 1 ? "" : "s"}
                  </span>
                ) : null}
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400">
                  <Table2 className="h-3.5 w-3.5" />
                  Table {order.tableNumber}
                </span>
              </span>
              <span className="ml-3 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700">
                <IndianRupee className="h-3.5 w-3.5" />
                {currency.format(order.total)}
              </span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
