"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleAlert,
  Copy,
  Loader2,
  PlugZap,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FlashProxyPlan, PlansListData } from "@/lib/plans/types";
import { getProductDisplay } from "@/components/purchase/purchase-utils";

type PlansScreenProps = {
  createdPlanId?: string;
};

type PlansResponse =
  | {
      success: true;
      data: PlansListData;
    }
  | {
      success: false;
      error?: {
        code?: string;
        message?: string;
      };
    };

export function PlansScreen({ createdPlanId }: PlansScreenProps) {
  const [data, setData] = useState<PlansListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/plans?page=1&per_page=20&status=all&sort=created_at&order=desc",
          {
            method: "GET",
            cache: "no-store",
          }
        );
        const json = (await response.json()) as PlansResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !json.success) {
          setError(
            json.success === false
              ? (json.error?.message ?? "Unable to load plans")
              : "Unable to load plans"
          );
          return;
        }

        setData(json.data);
      } catch {
        if (!cancelled) {
          setError("Unable to load plans");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => data?.items ?? data?.plans ?? [], [data]);
  const activeCount = useMemo(
    () => items.filter((item) => item.status === "active").length,
    [items]
  );

  const totalMonthlySpend = useMemo(
    () =>
      items.reduce((sum, item) => sum + (item.billing?.cost_cents ?? 0), 0) / 100,
    [items]
  );

  async function handleCopy(plan: FlashProxyPlan) {
    const value = plan.connection?.format;

    if (!value || !plan.plan_id) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedPlanId(plan.plan_id);

    window.setTimeout(() => {
      setCopiedPlanId((current) => (current === plan.plan_id ? null : current));
    }, 1800);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {createdPlanId ? (
        <Card className="border-primary/25 bg-primary/8">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">
                Plan created
              </p>
              <p className="text-sm text-muted-foreground">{createdPlanId}</p>
            </div>
            <Badge variant="success">Live now</Badge>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<PlugZap className="size-4 text-primary" />}
          label="Plans"
          value={String(data?.pagination?.total ?? items.length)}
        />
        <MetricCard
          icon={<Wallet className="size-4 text-primary" />}
          label="Active"
          value={String(activeCount)}
        />
        <MetricCard
          icon={<RefreshCw className="size-4 text-primary" />}
          label="Spend"
          value={`$${totalMonthlySpend.toFixed(2)}`}
        />
      </section>

      <Card className="bg-card/88 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl tracking-normal">Plans</CardTitle>
          </div>
          <Badge variant="secondary">{items.length} loaded</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-44 items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <CircleAlert className="size-4" />
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No plans yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Connection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((plan, index) => {
                  const product = plan.product
                    ? getProductDisplay(plan.product as never)
                    : null;
                  const used = plan.limits?.bytes_used ?? 0;
                  const max = plan.limits?.max_bytes ?? 0;
                  const usagePercent =
                    max > 0 ? Math.min(100, Math.round((used / max) * 100)) : null;

                  return (
                    <TableRow
                      key={plan.plan_id || `${plan.product || "plan"}-${index}`}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {product?.label ?? plan.product ?? "--"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan.billing_type ?? product?.group ?? "--"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={plan.status === "active" ? "success" : "secondary"}
                        >
                          {plan.status ?? "--"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncate(plan.plan_id)}
                      </TableCell>
                      <TableCell>{plan.proxy_username ?? "--"}</TableCell>
                      <TableCell>
                        {usagePercent === null ? "--" : `${usagePercent}%`}
                      </TableCell>
                      <TableCell>{formatDate(plan.expires_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          disabled={!plan.connection?.format}
                          onClick={() => void handleCopy(plan)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Copy className="size-4" />
                          {copiedPlanId === plan.plan_id ? "Copied" : "Copy"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
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
        <div className="rounded-md border bg-background/70 p-2">{icon}</div>
      </CardContent>
    </Card>
  );
}

function truncate(value?: string) {
  if (!value) {
    return "--";
  }

  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "No expiry";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
