import { Activity, AlertTriangle, CreditCard, Package } from "lucide-react";

import { ProductUsage } from "@/components/dashboard/product-usage";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/dashboard/summary";

type OverviewPageProps = {
  summary: DashboardSummary;
};

export function OverviewPage({ summary }: OverviewPageProps) {
  const partialErrorCount = Object.values(summary.partialErrors).filter(Boolean).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {partialErrorCount ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-4" />
          Some dashboard data is temporarily unavailable.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          detail={`Spent ${summary.balance.totalSpentFormatted}`}
          icon={CreditCard}
          label="Balance"
          value={summary.balance.balanceFormatted}
        />
        <SummaryCard
          detail={`${summary.plans.highUsage} high usage`}
          icon={Package}
          label="Active plans"
          value={summary.plans.active}
        />
        <SummaryCard
          detail={summary.usage.period}
          icon={Activity}
          label="Monthly usage"
          value={summary.usage.totalBytesFormatted}
        />
        <SummaryCard
          detail={summary.realtime.updatedAt ? "Updated recently" : "No live data"}
          icon={Activity}
          label="Active sessions"
          value={summary.realtime.totalActiveSessions}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <UsageChart data={summary.usage.dailyBreakdown} />
          </CardContent>
        </Card>

        <ProductUsage products={summary.usage.byProduct} />
      </section>
    </div>
  );
}
