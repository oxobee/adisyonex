"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import type { DashboardHourlyTraffic } from "@/types/dashboard";

interface HourlyTooltipProps {
  active?: boolean;
  payload?: readonly { value: number; payload: DashboardHourlyTraffic }[];
}

function HourlyTooltip({ active, payload }: HourlyTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const data = item.payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-left animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-1.5 mb-1.5 border-b border-gray-100 pb-1.5">
        <span className="size-2 rounded-full bg-amber-500" />
        <span className="text-xs font-semibold text-gray-700">
          Saat: {data.hour}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">Sipariş Sayısı:</span>
          <span className="font-semibold text-gray-900">{data.orders} adet</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-500">Toplam Ciro:</span>
          <span className="font-bold text-emerald-600">{formatCurrency(data.sales)}</span>
        </div>
      </div>
    </div>
  );
}

export function HourlyTrafficChart({
  data,
}: {
  readonly data: readonly DashboardHourlyTraffic[];
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between gap-2 mb-4 px-1">
        <span className="text-xs text-gray-500 font-medium">
          Bugün saatlik sipariş yoğunluğu ve ciro
        </span>
      </div>

      <div className="h-[250px] sm:h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data as DashboardHourlyTraffic[]}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tick={{ fontSize: 10, fill: "#6b7280" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#6b7280" }}
            />
            <Tooltip content={<HourlyTooltip />} />
            <Bar
              dataKey="orders"
              fill="url(#hourlyGrad)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
