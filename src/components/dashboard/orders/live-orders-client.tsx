"use client";

import { useMemo, useState } from "react";
import { 
  CheckCircle2, 
  Search, 
  UtensilsCrossed, 
  ChefHat, 
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { WorkflowOrderCard } from "@/components/dashboard/orders/workflow-order-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardOrder } from "@/lib/orders-types";

interface LiveOrdersClientProps {
  orders: DashboardOrder[];
  canAcceptOrders: boolean;
  canConfirmPayments: boolean;
  canPrepareOrders?: boolean;
  canServeOrders?: boolean;
}

type TabType = "all" | "pending" | "preparing" | "ready" | "unpaid";

export function LiveOrdersClient({
  orders,
  canAcceptOrders,
  canConfirmPayments,
  canPrepareOrders = true,
  canServeOrders = true,
}: LiveOrdersClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "PENDING"), [orders]);
  const preparingOrders = useMemo(() => orders.filter((o) => o.status === "PREPARING" || o.status === "ACCEPTED"), [orders]);
  const readyOrders = useMemo(() => orders.filter((o) => o.status === "READY"), [orders]);
  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && o.status !== "PENDING"),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeTab === "pending") list = pendingOrders;
    else if (activeTab === "preparing") list = preparingOrders;
    else if (activeTab === "ready") list = readyOrders;
    else if (activeTab === "unpaid") list = unpaidOrders;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.tableNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [orders, activeTab, pendingOrders, preparingOrders, readyOrders, unpaidOrders, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-500/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            All Orders
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "all" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {pendingOrders.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Incoming / New
            {pendingOrders.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  activeTab === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preparing")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "preparing"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            Preparing
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "preparing" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {preparingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "ready"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Ready for Pickup
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "ready" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {readyOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unpaid")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "unpaid"
                ? "bg-zinc-900 text-white shadow-sm shadow-zinc-900/20"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Active Dining
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === "unpaid" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {unpaidOrders.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search table, #ORD, dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredOrders.map((order) => (
            <WorkflowOrderCard
              key={order.id}
              order={order}
              stage="admin"
              canAccept={canAcceptOrders}
              canConfirmPayment={canConfirmPayments}
              canPrepare={canPrepareOrders}
              canServe={canServeOrders}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-8">
          <EmptyState
            icon={CheckCircle2}
            title={`No ${activeTab === "all" ? "" : activeTab} orders right now`}
            description={
              searchQuery
                ? `No orders matching "${searchQuery}". Try clearing your search filter.`
                : "All incoming QR table orders are clear and updated in real time."
            }
          />
        </div>
      )}
    </div>
  );
}
