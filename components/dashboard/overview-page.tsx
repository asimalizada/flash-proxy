"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Package,
  Zap,
} from "lucide-react";

import { ProductUsage } from "@/components/dashboard/product-usage";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/dashboard/summary";

type OverviewPageProps = {
  summary: DashboardSummary;
};

export function OverviewPage({ summary }: OverviewPageProps) {
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [isDeferredLoading, setIsDeferredLoading] = useState(true);
  const partialErrorCount = Object.values(currentSummary.partialErrors).filter(Boolean).length;

  useEffect(() => {
    let cancelled = false;

    async function loadDeferredSummary() {
      try {
        const response = await fetch("/api/dashboard/summary", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as
          | { success: true; data: DashboardSummary }
          | { success: false };

        if (!cancelled && response.ok && json.success) {
          setCurrentSummary(json.data);
        }
      } finally {
        if (!cancelled) {
          setIsDeferredLoading(false);
        }
      }
    }

    void loadDeferredSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-md border bg-card/88 px-5 py-5 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(115deg,transparent,color-mix(in_oklch,var(--primary)_9%,transparent))]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Zap className="size-3.5 text-primary" />
              Live reseller overview
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
              ${currentSummary.balance.balanceFormatted.replace("$", "")} available
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/buy">
                Buy proxy
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/plans">View plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {partialErrorCount ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-4" />
          Some dashboard data is temporarily unavailable.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          detail={`Spent ${currentSummary.balance.totalSpentFormatted}`}
          icon={CreditCard}
          label="Balance"
          value={currentSummary.balance.balanceFormatted}
          tone="primary"
        />
        <SummaryCard
          detail={`${currentSummary.plans.highUsage} high usage`}
          icon={Package}
          label="Active plans"
          value={currentSummary.plans.active}
          tone="blue"
        />
        <SummaryCard
          detail={currentSummary.usage.period}
          icon={Activity}
          isLoading={isDeferredLoading}
          label="Monthly usage"
          value={currentSummary.usage.totalBytesFormatted}
          tone="amber"
        />
        <SummaryCard
          detail={
            currentSummary.realtime.updatedAt ? "Updated recently" : "No live data"
          }
          icon={Activity}
          isLoading={isDeferredLoading}
          label="Active sessions"
          value={currentSummary.realtime.totalActiveSessions}
          tone="rose"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-all duration-300 hover:border-primary/25">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Usage</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentSummary.usage.totalBytesFormatted}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/plans">Details</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <UsageChart
              data={currentSummary.usage.dailyBreakdown}
              isLoading={isDeferredLoading}
            />
          </CardContent>
        </Card>

        <ProductUsage
          isLoading={isDeferredLoading}
          products={currentSummary.usage.byProduct}
        />
      </section>
    </div>
  );
}
