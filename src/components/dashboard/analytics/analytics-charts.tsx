"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
};

export function AnalyticsCharts({ data, rangeDays }: { data: AnalyticsChartData; rangeDays: number }) {
  function formatTooltipCurrency(value: unknown) {
    const numericValue = typeof value === "number" ? value : Number(value ?? 0);

    return [formatCurrency(Number.isFinite(numericValue) ? numericValue : 0), "Revenue"] as const;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
      {/* Revenue Area Chart */}
      <Card className="min-h-80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Daily Sales Trend</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Verified paid revenue for the last {rangeDays} days.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            INR (₹)
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueByDay} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
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
              <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Orders Volume Chart */}
      <Card className="min-h-80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Paid Order Volume</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Order count for {rangeDays} days.</p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
            Volume
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.ordersByDay} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} width={32} />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Hourly Demand Chart */}
      <Card className="p-6 xl:col-span-2">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Peak Dining Hours</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Order volume distributed by hour of day (lunch vs dinner rush).</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            Rush Hours
          </span>
        </div>
        {data.busyHours.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.busyHours} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    borderColor: "#e2e8f0",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center">
            <p className="text-xs font-semibold text-zinc-500">
              Peak dining hour charts will generate automatically as table orders are processed.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
