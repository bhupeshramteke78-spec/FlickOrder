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

const categoryData = [
  { name: "Main Course", value: 45, color: "#f43f5e" },
  { name: "Beverages", value: 25, color: "#0f172a" },
  { name: "Appetizers", value: 20, color: "#475569" },
  { name: "Desserts", value: 10, color: "#cbd5e1" },
];

export function AnalyticsCharts({ data, rangeDays }: { data: AnalyticsChartData; rangeDays: number }) {
  function formatTooltipCurrency(value: unknown) {
    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
    return [formatCurrency(Number.isFinite(numericValue) ? numericValue : 0), "Revenue"] as const;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Revenue Growth Line/Area Chart matching Page 4 */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base font-black text-zinc-950">Revenue Growth</h2>
              <p className="text-xs text-zinc-500 font-medium">Verified sales revenue for the last {rangeDays} days</p>
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

        {/* Sales by Category Donut Chart matching Page 4 */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-base font-black text-zinc-950">Sales by Category</h2>
              <p className="text-xs text-zinc-500 font-medium">Distribution of ordered food items</p>
            </div>
          </div>

          <div className="h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val}%`, "Share"]}
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-black text-zinc-800">100% Total</span>
            </div>
          </div>

          {/* Category Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-50">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-600 font-medium">{item.name}</span>
                <span className="font-bold text-zinc-900 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Peak Ordering Hours Heatmap matching Page 4 */}
      <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-black text-zinc-950">Peak Ordering Hours</h2>
            <p className="text-xs text-zinc-500 font-medium">Hourly customer traffic density across weekdays</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            <span>Low</span>
            <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-rose-100 via-rose-300 to-rose-600" />
            <span>High</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[540px] space-y-2">
            {[
              { day: "Fri", values: [35, 50, 65, 90, 75] },
              { day: "Wed", values: [25, 45, 75, 95, 60] },
              { day: "Mon", values: [20, 30, 40, 70, 50] },
            ].map((row) => (
              <div key={row.day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-zinc-500 text-right">{row.day}</span>
                <div className="grid grid-cols-5 gap-2 flex-1">
                  {row.values.map((v, i) => {
                    const bgClass =
                      v > 80
                        ? "bg-rose-600 text-white font-black"
                        : v > 60
                          ? "bg-rose-400 text-white font-bold"
                          : v > 40
                            ? "bg-rose-200 text-rose-950 font-semibold"
                            : "bg-rose-50 text-rose-900 font-medium";

                    return (
                      <div
                        key={i}
                        className={`h-14 rounded-xl flex items-center justify-center text-xs transition-transform hover:scale-105 shadow-xs ${bgClass}`}
                      >
                        {v} orders
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* X-Axis Hours */}
            <div className="flex items-center gap-3 pt-2">
              <span className="w-10" />
              <div className="grid grid-cols-5 gap-2 flex-1 text-center text-xs font-bold text-zinc-500">
                <span>12 PM</span>
                <span>2 PM</span>
                <span>4 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
