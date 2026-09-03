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
    <div className="rounded-2xl border border-white/15 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-2 mb-1.5 border-b border-white/10 pb-1.5">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-zinc-300">
          {data.label}. Gün ({data.date})
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold text-zinc-400">Toplam Satış:</span>
        <span className="text-sm font-black text-emerald-400 tabular-nums">
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
          <span>Bu ayın günlük satış grafiği</span>
        </div>

        {/* Görünüm Geçişi (Area vs Bar) */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer select-none",
              chartType === "area"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Eğri (Alan)
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer select-none",
              chartType === "bar"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-muted-foreground/15"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => `₺${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesAreaGrad)"
                activeDot={{
                  r: 6,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                  className: "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]",
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
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-muted-foreground/15"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => `₺${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="sales"
                fill="url(#salesBarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
