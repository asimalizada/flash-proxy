"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UsageChartProps = {
  data: Array<{
    date?: string;
    bytes_used?: number;
  }>;
};

function bytesToGb(bytes = 0) {
  return Number((bytes / 1_000_000_000).toFixed(2));
}

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    gb: bytesToGb(item.bytes_used),
  }));
  const hasData = chartData.some((item) => item.gb > 0);

  if (!hasData) {
    const bars = [38, 54, 44, 68, 58, 76, 48, 62, 84, 52, 72, 60];

    return (
      <div className="relative h-72 overflow-hidden rounded-md border bg-background/56 p-6">
        <div className="absolute inset-6 rounded-md bg-[linear-gradient(to_right,color-mix(in_oklch,var(--border)_46%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_46%,transparent)_1px,transparent_1px)] bg-[size:46px_46px] opacity-55" />
        <div className="relative flex h-full items-end gap-2">
          {bars.map((height, index) => (
            <div
              className="min-w-0 flex-1 rounded-sm bg-gradient-to-t from-primary/28 to-primary/5 transition-all duration-300 hover:from-primary/42"
              key={index}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        <p className="absolute left-6 top-5 text-sm font-medium text-muted-foreground">
          No usage yet
        </p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={chartData} margin={{ left: 0, right: 6, top: 12 }}>
          <defs>
            <linearGradient id="usage-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            axisLine={false}
            dataKey="date"
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickFormatter={(value) => `${value} GB`}
            tickLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--popover-foreground)",
            }}
            formatter={(value) => [`${value} GB`, "Usage"]}
          />
          <Area
            dataKey="gb"
            fill="url(#usage-fill)"
            stroke="var(--primary)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
