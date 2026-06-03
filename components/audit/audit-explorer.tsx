import Link from "next/link";
import type { AuditLog, Prisma } from "@prisma/client";
import { Filter, History, KeyRound, Search } from "lucide-react";

import { auditActionOptions, auditResourceTypeOptions } from "@/lib/audit/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditExplorerProps = {
  actionCounts: Array<{
    action: string;
    _count: {
      action: number;
    };
  }>;
  filters: {
    action?: string;
    q?: string;
    resourceType?: string;
  };
  items: AuditLog[];
  recentCount: number;
  resourceCounts: Array<{
    resourceType: string | null;
    _count: {
      resourceType: number;
    };
  }>;
  total: number;
};

export function AuditExplorer({
  actionCounts,
  filters,
  items,
  recentCount,
  resourceCounts,
  total,
}: AuditExplorerProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<History className="size-4 text-primary" />}
          label="Events"
          value={String(total)}
        />
        <MetricCard
          icon={<Filter className="size-4 text-primary" />}
          label="Last 24h"
          value={String(recentCount)}
        />
        <MetricCard
          icon={<KeyRound className="size-4 text-primary" />}
          label="Filtered"
          value={
            filters.action || filters.resourceType || filters.q ? "Yes" : "No"
          }
        />
      </section>

      <Card className="bg-card/88 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-2xl tracking-normal">Audit log</CardTitle>
            <div className="flex flex-wrap gap-2">
              {filters.action || filters.resourceType || filters.q ? (
                <Button asChild size="sm" type="button" variant="outline">
                  <Link href="/audit">Clear filters</Link>
                </Button>
              ) : null}
              <Badge variant="secondary">{items.length} shown</Badge>
            </div>
          </div>

          <form className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                defaultValue={filters.q ?? ""}
                name="q"
                placeholder="Search resource ID or key hash"
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={filters.action ?? ""}
              name="action"
            >
              <option value="">All actions</option>
              {auditActionOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnum(option)}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={filters.resourceType ?? ""}
              name="resourceType"
            >
              <option value="">All resources</option>
              {auditResourceTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnum(option)}
                </option>
              ))}
            </select>
            <Button type="submit">Apply</Button>
          </form>

          <div className="grid gap-3 lg:grid-cols-2">
            <CountPanel
              items={actionCounts.map((item) => ({
                label: formatEnum(item.action),
                value: item._count.action,
              }))}
              title="Top actions"
            />
            <CountPanel
              items={resourceCounts.map((item) => ({
                label: formatEnum(item.resourceType ?? "unknown"),
                value: item._count.resourceType,
              }))}
              title="Top resources"
            />
          </div>
        </CardHeader>

        <CardContent>
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No audit events match these filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const metadata = asRecord(item.metadata);
                  const status = getStatus(metadata);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatEnum(item.action)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {formatEnum(item.resourceType ?? "unknown")}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {item.resourceId ?? truncate(item.apiKeyHash) ?? "--"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === "success" ? "success" : "secondary"}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[340px] text-sm text-muted-foreground">
                        {buildSummary(metadata)}
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

function CountPanel({
  items,
  title,
}: {
  items: Array<{ label: string; value: number }>;
  title: string;
}) {
  return (
    <div className="rounded-md border bg-background/52 p-4">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge className="gap-2" key={item.label} variant="outline">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function truncate(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getStatus(metadata: Record<string, unknown>) {
  return typeof metadata.status === "string" ? metadata.status : "recorded";
}

function buildSummary(metadata: Record<string, unknown>) {
  const interesting = [
    metadata.product,
    metadata.billing_type,
    metadata.error_code,
    metadata.cost_cents ? `$${(Number(metadata.cost_cents) / 100).toFixed(2)}` : null,
    metadata.source,
  ].filter(Boolean);

  if (!interesting.length) {
    return "No extra metadata";
  }

  return interesting.join(" • ");
}
