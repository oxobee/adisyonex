"use client";

import { useState } from "react";
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

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardTrendPoint } from "@/types/dashboard";

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { value: number; payload: DashboardTrendPoint }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const data = item.payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-left animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-1.5 mb-1.5 border-b border-gray-100 pb-1.5">
        <span className="size-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-gray-700">
          {data.label}. Gün ({data.date})
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-gray-500">Satış:</span>
        <span className="text-sm font-bold text-gray-900 tabular-nums">
          {formatCurrency(Number(item.value))}
        </span>
      </div>
    </div>
  );
}

export function SalesTrendChart({
  data,
}: {
  readonly data: readonly DashboardTrendPoint[];
}) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  return (
    <div className="flex flex-col w-full">
      {/* Üst Filtre Barı */}
      <div className="flex items-center justify-between gap-2 mb-4 px-1">
        <span className="text-xs text-gray-500 font-medium">
          Bu ayın günlük satış grafiği
        </span>

        {/* Görünüm Geçişi (Area vs Bar) */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={cn(
              "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer select-none",
              chartType === "area"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            Eğri (Alan)
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={cn(
              "px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer select-none",
              chartType === "bar"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            Sütun
          </button>
        </div>
      </div>

      {/* Recharts Konteyneri */}
      <div className="h-[250px] sm:h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart
              data={data as DashboardTrendPoint[]}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.06} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => `₺${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#salesAreaGrad)"
                activeDot={{
                  r: 5,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data as DashboardTrendPoint[]}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => `₺${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="sales"
                fill="url(#salesBarGrad)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
