"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleAlert, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendPlanDialog } from "@/components/plans/extend-plan-dialog";
import { PlanDetailHeader } from "@/components/plans/plan-detail-header";
import { PlanMetricsPanel } from "@/components/plans/plan-metrics-panel";
import { PlanUsageCard } from "@/components/plans/plan-usage-card";
import { ProxyConnectionHelper } from "@/components/plans/proxy-connection-helper";
import type {
  FlashProxyPlan,
  PlanMetricsData,
  PlanUsageData,
} from "@/lib/plans/types";
import type { ProxyConnectionInfoData } from "@/lib/proxies/types";
import {
  normalizePlanProduct,
  formatBytesToGb,
  getPlanCost,
} from "@/lib/plans/presentation";
import {
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/plans/formatters";
import { Copy } from "lucide-react";

type PlanDetailScreenProps = {
  planId: string;
};

type PlanResponse =
  | { success: true; data: FlashProxyPlan }
  | { success: false; error?: { code?: string; message?: string } };

type PlanUsageResponse =
  | { success: true; data: PlanUsageData }
  | { success: false; error?: { code?: string; message?: string } };

type PlanMetricsResponse =
  | { success: true; data: PlanMetricsData }
  | { success: false; error?: { code?: string; message?: string } };

type ProxyConnectionInfoResponse =
  | { success: true; data: ProxyConnectionInfoData }
  | { success: false; error?: { code?: string; message?: string } };

export function PlanDetailScreen({ planId }: PlanDetailScreenProps) {
  const router = useRouter();
  const [data, setData] = useState<FlashProxyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<PlanUsageData | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<PlanMetricsData | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [connectionInfo, setConnectionInfo] =
    useState<ProxyConnectionInfoData | null>(null);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/plans/${planId}`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as PlanResponse;

        if (cancelled) return;

        if (!response.ok || !json.success) {
          setError(
            json.success === false
              ? (json.error?.message ?? "Unable to load plan")
              : "Unable to load plan"
          );
          return;
        }

        setData(json.data);
      } catch {
        if (!cancelled) setError("Unable to load plan");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPlan();
    return () => { cancelled = true; };
  }, [planId, refreshNonce]);

  useEffect(() => {
    let cancelled = false;

    async function loadConnectionInfo() {
      try {
        const response = await fetch("/api/proxies/connection-info", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as ProxyConnectionInfoResponse;

        if (cancelled) return;
        if (response.ok && json.success) setConnectionInfo(json.data);
      } catch {
        if (!cancelled) setConnectionInfo(null);
      }
    }

    void loadConnectionInfo();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      setIsUsageLoading(true);
      setUsageError(null);

      try {
        const response = await fetch(`/api/plans/${planId}/usage`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as PlanUsageResponse;

        if (cancelled) return;

        if (!response.ok || !json.success) {
          setUsageError(
            json.success === false
              ? (json.error?.message ?? "Usage unavailable")
              : "Usage unavailable"
          );
          return;
        }

        setUsageData(json.data);
      } catch {
        if (!cancelled) setUsageError("Usage unavailable");
      } finally {
        if (!cancelled) setIsUsageLoading(false);
      }
    }

    void loadUsage();
    return () => { cancelled = true; };
  }, [planId, refreshNonce]);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      setIsMetricsLoading(true);
      setMetricsError(null);

      try {
        const response = await fetch(`/api/plans/${planId}/metrics?hours=24`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as PlanMetricsResponse;

        if (cancelled) return;

        if (!response.ok || !json.success) {
          setMetricsError(
            json.success === false
              ? (json.error?.message ?? "Metrics unavailable")
              : "Metrics unavailable"
          );
          return;
        }

        setMetricsData(json.data);
      } catch {
        if (!cancelled) setMetricsError("Metrics unavailable");
      } finally {
        if (!cancelled) setIsMetricsLoading(false);
      }
    }

    void loadMetrics();
    return () => { cancelled = true; };
  }, [planId, refreshNonce]);

  const normalizedProduct = useMemo(
    () => normalizePlanProduct(data?.product),
    [data?.product]
  );
  const bytesUsed = data?.limits?.bytes_used ?? 0;
  const maxBytes = data?.limits?.max_bytes ?? null;
  const canExtend = normalizedProduct !== "unlimited_residential";

  async function handleCopy(key: string, value?: string | number | null) {
    if (!value) return;
    await navigator.clipboard.writeText(String(value));
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  }

  async function handleExtendPlan(
    payload: {
      add_bandwidth_gb?: number;
      add_days?: number;
      extend_30_days?: true;
    },
    idempotencyKey: string
  ) {
    setIsExtending(true);
    setError(null);

    try {
      const response = await fetch(`/api/plans/${planId}/extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as
        | { success: true }
        | { success: false; error?: { message?: string } };

      if (!response.ok || !json.success) {
        setError(
          json.success === false
            ? (json.error?.message ?? "Unable to extend plan")
            : "Unable to extend plan"
        );
        return;
      }

      setIsExtendDialogOpen(false);
      setRefreshNonce((current) => current + 1);
      router.refresh();
    } catch {
      setError("Unable to extend plan");
    } finally {
      setIsExtending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" type="button" variant="outline">
          <Link href="/plans">
            <ArrowLeft className="size-4" />
            Back to plans
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card className="bg-card/86">
          <CardContent className="flex h-80 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-card/86">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <CircleAlert className="size-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <PlanDetailHeader
            canExtend={canExtend}
            onExtend={() => setIsExtendDialogOpen(true)}
            plan={data}
          />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Purchase" value={getPlanCost(data)} />
            <MetricCard label="Used" value={formatBytesToGb(bytesUsed)} />
            <MetricCard label="Limit" value={formatBytesToGb(maxBytes)} />
            <MetricCard label="Expires" value={formatDate(data.expires_at)} />
          </section>

          <ProxyConnectionHelper connectionInfo={connectionInfo} plan={data} />

          <section className="grid gap-4 xl:grid-cols-2">
            <PlanUsageCard
              error={usageError}
              isLoading={isUsageLoading}
              plan={data}
              usageData={usageData}
            />

            <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
              <CardHeader>
                <CardTitle>Plan data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryRow label="Created" value={formatDateTime(data.created_at)} />
                <SummaryRow label="Activated" value={formatDateTime(data.activated_at)} />
                <SummaryRow label="Updated" value={formatDateTime(data.updated_at)} />
                <SummaryRow label="Reference" value={data.end_user_reference ?? "--"} />
                <SummaryRow label="Provider ID" value={data.provider_user_id ?? "--"} />
                <SummaryRow
                  label="Allowed IPs"
                  value={data.allowed_ips?.length ? data.allowed_ips.join(", ") : "--"}
                />
              </CardContent>
            </Card>
          </section>

          <PlanMetricsPanel
            data={metricsData}
            error={metricsError}
            isLoading={isMetricsLoading}
          />

          {data.proxy_list?.length ? (
            <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
              <CardHeader>
                <CardTitle>Proxy list</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.proxy_list.map((proxy, index) => (
                  <div
                    className="flex flex-col gap-3 rounded-md border bg-background/52 p-4 sm:flex-row sm:items-center sm:justify-between"
                    key={`${proxy.host}-${proxy.port}-${index}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {proxy.host}:{proxy.port}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {proxy.full ?? "--"}
                      </p>
                    </div>
                    <Button
                      disabled={!proxy.full}
                      onClick={() => void handleCopy(`proxy-${index}`, proxy.full)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Copy className="size-4" />
                      {copiedKey === `proxy-${index}` ? "Copied" : "Copy"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {data ? (
        <ExtendPlanDialog
          isOpen={isExtendDialogOpen}
          isSubmitting={isExtending}
          onConfirm={(payload, idempotencyKey) =>
            void handleExtendPlan(payload, idempotencyKey)
          }
          onOpenChange={setIsExtendDialogOpen}
          plan={data}
        />
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/84">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-normal">{value}</p>
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
