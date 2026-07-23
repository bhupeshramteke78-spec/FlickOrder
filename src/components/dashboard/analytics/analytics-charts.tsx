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
    <div className="grid gap-4 xl:grid-cols-[1fr_0.72fr]">
      <Card className="min-h-80">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-zinc-950">Revenue per day</h2>
          <p className="mt-1 text-sm text-zinc-500">Last {rangeDays} days, paid orders only.</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueByDay} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} tickFormatter={(value: number) => `Rs ${value}`} width={56} />
              <Tooltip formatter={formatTooltipCurrency} contentStyle={{ borderRadius: 12, borderColor: "#e4e4e7" }} />
              <Area type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={3} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="min-h-80">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-zinc-950">Orders per day</h2>
          <p className="mt-1 text-sm text-zinc-500">Verified paid order volume for {rangeDays} days.</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.ordersByDay} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} width={32} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e4e4e7" }} />
              <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-zinc-950">Busy hours</h2>
          <p className="mt-1 text-sm text-zinc-500">Paid order count by hour.</p>
        </div>
        {data.busyHours.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.busyHours} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#71717a", fontSize: 12 }} width={32} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e4e4e7" }} />
                <Bar dataKey="orders" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
            Busy hours appear after paid orders are recorded.
          </p>
        )}
      </Card>
    </div>
  );
}
