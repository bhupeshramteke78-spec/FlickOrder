"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type CategorySalesShare = {
  name: string;
  value: number; // percentage (0-100)
  sales: number; // in ₹
  count: number;
  color: string;
};

export type DayHourlyTraffic = {
  day: string;
  slots: Array<{
    hourLabel: string;
    ordersCount: number;
  }>;
};

export type AnalyticsChartData = {
  revenueByDay: Array<{
    label: string;
    revenue: number;
  }>;
  ordersByDay: Array<{
    label: string;
    orders: number;
  }>;
  busyHours: Array<{
    label: string;
    orders: number;
  }>;
  categoryDistribution: CategorySalesShare[];
  weeklyHeatmap: DayHourlyTraffic[];
};

export function AnalyticsCharts({ data, rangeDays }: { data: AnalyticsChartData; rangeDays: number }) {
  function formatTooltipCurrency(value: unknown) {
    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
    return [formatCurrency(Number.isFinite(numericValue) ? numericValue : 0), "Revenue"] as const;
  }

  const hasCategories = data.categoryDistribution && data.categoryDistribution.length > 0;
  const heatmapRows = data.weeklyHeatmap || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Revenue Growth Line/Area Chart */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base font-black text-zinc-950">Revenue Growth</h2>
              <p className="text-xs text-zinc-500 font-medium">Real sales revenue over the last {rangeDays} days</p>
            </div>
            <span className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              INR (₹)
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByDay} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="roseRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f8fafc" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(value: number) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  width={48}
                />
                <Tooltip
                  formatter={formatTooltipCurrency}
                  contentStyle={{
                    borderRadius: 14,
                    borderColor: "#e2e8f0",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e11d48"
                  strokeWidth={3}
                  fill="url(#roseRevenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Real Sales by Category Donut Chart */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base font-black text-zinc-950">Sales by Category</h2>
              <p className="text-xs text-zinc-500 font-medium">Real category revenue distribution from orders</p>
            </div>
          </div>

          {hasCategories ? (
            <>
              <div className="h-48 relative my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.categoryDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, entry) => {
                        const item = entry?.payload as CategorySalesShare;
                        return [`${val}% (${formatCurrency(item?.sales || 0)})`, "Share"] as const;
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-black text-zinc-800">100% Total</span>
                </div>
              </div>

              {/* Category Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-zinc-100 max-h-28 overflow-y-auto">
                {data.categoryDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-700 font-medium truncate text-[11px]">{item.name}</span>
                    <span className="font-bold text-zinc-950 ml-auto text-[11px]">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <Utensils className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-xs font-semibold text-zinc-600">No category sales data yet</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Category share will calculate automatically when orders are placed.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Real Peak Ordering Hours Heatmap */}
      <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-black text-zinc-950">Peak Ordering Hours &amp; Weekly Rush</h2>
            <p className="text-xs text-zinc-500 font-medium">Real customer order density across weekdays and time slots</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            <span>0 Orders</span>
            <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-zinc-100 via-rose-300 to-rose-600" />
            <span>Rush</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[540px] space-y-2">
            {heatmapRows.map((row) => (
              <div key={row.day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-zinc-600 text-right">{row.day}</span>
                <div className="grid grid-cols-5 gap-2 flex-1">
                  {row.slots.map((slot, i) => {
                    const count = slot.ordersCount;
                    const bgClass =
                      count >= 10
                        ? "bg-rose-600 text-white font-black"
                        : count >= 5
                        ? "bg-rose-500 text-white font-bold"
                        : count >= 3
                        ? "bg-rose-300 text-rose-950 font-semibold"
                        : count >= 1
                        ? "bg-rose-100 text-rose-900 font-medium"
                        : "bg-zinc-50 text-zinc-400 font-medium border border-zinc-100";

                    return (
                      <div
                        key={i}
                        className={`h-12 rounded-xl flex flex-col items-center justify-center text-xs transition-transform hover:scale-105 shadow-xs ${bgClass}`}
                        title={`${row.day} ${slot.hourLabel}: ${count} orders`}
                      >
                        <span className="font-bold leading-none">{count}</span>
                        <span className="text-[10px] opacity-80 leading-none mt-0.5">{count === 1 ? "order" : "orders"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* X-Axis Slot Labels */}
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
              <span className="w-10" />
              <div className="grid grid-cols-5 gap-2 flex-1 text-center text-xs font-bold text-zinc-600">
                <span>12 - 2 PM (Lunch)</span>
                <span>2 - 4 PM (Afternoon)</span>
                <span>4 - 6 PM (Evening)</span>
                <span>6 - 8 PM (Dinner)</span>
                <span>8 - 10 PM (Late)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
