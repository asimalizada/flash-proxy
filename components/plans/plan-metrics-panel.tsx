"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Gauge, RadioTower, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanMetricsData } from "@/lib/plans/types";

type PlanMetricsPanelProps = {
  data: PlanMetricsData | null;
  error: string | null;
  isLoading: boolean;
};

export function PlanMetricsPanel({
  data,
  error,
  isLoading,
}: PlanMetricsPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Loading metrics
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/86">
        <CardContent className="rounded-md border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.supported) {
    return (
      <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-background/56 px-4 py-6 text-sm text-muted-foreground">
            Performance metrics are not available for this product.
          </div>
        </CardContent>
      </Card>
    );
  }

  const throughput = data.throughput.series ?? [];
  const latency = data.latency.series ?? [];
  const errors = (data.errors.series ?? []).map((item) => ({
    bucket: item.bucket,
    errors: sumErrorBucket(item),
  }));
  const destinations = data.destinations.destinations ?? [];

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-2xl font-semibold tracking-normal">Performance</h2>
        <Badge variant="secondary">{data.hours}h window</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ShieldCheck className="size-4" />}
          label="Success rate"
          value={formatPercent(data.summary.success_rate_pct)}
        />
        <MetricCard
          icon={<Gauge className="size-4" />}
          label="Peak Mbps"
          value={formatNumber(data.summary.peak_mbps)}
        />
        <MetricCard
          icon={<RadioTower className="size-4" />}
          label="Connections"
          value={formatInteger(data.summary.total_connections)}
        />
        <MetricCard
          icon={<Activity className="size-4" />}
          label="Errors"
          value={formatInteger(data.summary.total_errors)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Throughput">
          <ResponsiveContainer height={260} width="100%">
            <AreaChart data={throughput.map(formatBucket)}>
              <defs>
                <linearGradient id="metrics-throughput" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="bucket" tickLine={false} />
              <YAxis tickLine={false} width={54} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                dataKey="mbps"
                fill="url(#metrics-throughput)"
                name="Mbps"
                stroke="var(--primary)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Latency">
          <ResponsiveContainer height={260} width="100%">
            <LineChart data={latency.map(formatBucket)}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="bucket" tickLine={false} />
              <YAxis tickFormatter={(value) => `${value}ms`} tickLine={false} width={64} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="p50" dot={false} name="p50" stroke="var(--chart-2)" strokeWidth={2} />
              <Line dataKey="p95" dot={false} name="p95" stroke="var(--chart-3)" strokeWidth={2} />
              <Line dataKey="p99" dot={false} name="p99" stroke="var(--chart-4)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Errors">
          <ResponsiveContainer height={260} width="100%">
            <BarChart data={errors.map(formatBucket)}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="bucket" tickLine={false} />
              <YAxis allowDecimals={false} tickLine={false} width={48} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="errors" fill="var(--chart-4)" name="Errors" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
          <CardHeader>
            <CardTitle>Top destinations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {destinations.length ? (
              destinations.slice(0, 6).map((item) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-md border bg-background/52 px-3 py-2"
                  key={item.destination}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.destination ?? "--"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatInteger(item.connections)} connections
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatMb(item.mb_received)} down</p>
                    <p className="text-xs text-muted-foreground">
                      p95 {formatMs(item.p95_ms)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border bg-background/56 px-4 py-6 text-sm text-muted-foreground">
                No destination data in this window
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-card/84">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-normal">{value}</p>
        </div>
        <div className="rounded-md border bg-background/70 p-2 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--popover-foreground)",
};

function formatBucket<T extends { bucket?: string }>(item: T) {
  return {
    ...item,
    bucket: formatShortTime(item.bucket),
  };
}

function formatShortTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sumErrorBucket(item: Record<string, number | string | undefined>) {
  return Object.entries(item).reduce((total, [key, value]) => {
    if (key === "bucket" || typeof value !== "number") {
      return total;
    }

    return total + value;
  }, 0);
}

function formatInteger(value?: number) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatNumber(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return value.toFixed(2);
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value.toFixed(2)}%`;
}

function formatMb(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value.toFixed(2)} MB`;
}

function formatMs(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value)}ms`;
}
