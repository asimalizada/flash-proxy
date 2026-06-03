"use client";

import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import type { FlashProxyPlan, PlanUsageData } from "@/lib/plans/types";
import { formatBytesToGb } from "@/lib/plans/presentation";
import { formatNumber, formatPeriod } from "@/lib/plans/formatters";

type PlanUsageCardProps = {
  error: string | null;
  isLoading: boolean;
  plan: FlashProxyPlan;
  usageData: PlanUsageData | null;
};

export function PlanUsageCard({
  error,
  isLoading,
  plan,
  usageData,
}: PlanUsageCardProps) {
  const bytesUsed = plan.limits?.bytes_used ?? 0;
  const maxBytes = plan.limits?.max_bytes ?? null;
  const basePercent =
    maxBytes && maxBytes > 0 ? Math.round((bytesUsed / maxBytes) * 100) : null;

  const effectivePercent = usageData?.usage?.usage_percent ?? basePercent;
  const usageBytesUsed = usageData?.usage?.bytes_used ?? plan.limits?.bytes_used;
  const usageBytesRemaining = usageData?.usage?.bytes_remaining;
  const usageMaxBytes = usageData?.usage?.max_bytes ?? plan.limits?.max_bytes;

  const periodLabel =
    usageData?.period?.start || usageData?.period?.end
      ? formatPeriod(usageData.period?.start, usageData.period?.end)
      : null;

  return (
    <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Usage</CardTitle>
          {periodLabel ? (
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Consumption</span>
            <span className="font-medium">
              {effectivePercent === null ? "--" : `${effectivePercent}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.max(effectivePercent ?? 0, 4)}%`,
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-md bg-primary/10" />
            <div className="h-28 rounded-md bg-background/56" />
            <div className="h-10 rounded-md bg-muted/60" />
            <div className="h-10 rounded-md bg-muted/60" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-border/70 bg-background/52 px-3 py-3 text-sm text-muted-foreground">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading usage
          </div>
        ) : (
          <>
            <UsageChart data={usageData?.daily_breakdown ?? []} />
            <SummaryRow
              label="Bytes used"
              value={formatBytesToGb(usageBytesUsed)}
            />
            <SummaryRow
              label="Bytes remaining"
              value={formatBytesToGb(usageBytesRemaining)}
            />
            <SummaryRow
              label="Max bandwidth"
              value={formatBytesToGb(usageMaxBytes)}
            />
          </>
        )}

        <SummaryRow
          label="Max GB"
          value={formatNumber(plan.limits?.max_gb, "GB")}
        />
        <SummaryRow
          label="Max Mbps"
          value={formatNumber(plan.limits?.max_mbps, "Mbps")}
        />
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-background/52 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
    </div>
  );
}
