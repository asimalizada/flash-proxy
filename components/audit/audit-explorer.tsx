import Link from "next/link";
import type { AuditLog, Prisma } from "@prisma/client";
import { Filter, History, KeyRound, Search } from "lucide-react";
import type { ReactNode } from "react";

import { auditActionOptions, auditResourceTypeOptions } from "@/lib/audit/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
  };
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
  pagination,
  recentCount,
  resourceCounts,
  total,
}: AuditExplorerProps) {
  const firstItem = total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1;
  const lastItem = Math.min(pagination.page * pagination.perPage, total);

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
              <Badge variant="secondary">
                {firstItem}-{lastItem} of {total}
              </Badge>
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
            <Select defaultValue={filters.action ?? "all"} name="action">
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
              {auditActionOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatEnum(option)}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
            <Select defaultValue={filters.resourceType ?? "all"} name="resourceType">
              <SelectTrigger>
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
              {auditResourceTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatEnum(option)}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
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
          <div className="space-y-4">
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
                    <TableHead>Request</TableHead>
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
                          <Badge
                            variant={status === "success" ? "success" : "secondary"}
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                          <div>{item.ipAddress ?? "--"}</div>
                          <div className="truncate">{item.userAgent ?? "--"}</div>
                        </TableCell>
                        <TableCell className="max-w-[300px] text-sm text-muted-foreground">
                          {buildSummary(metadata)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {pagination.totalPages > 1 ? (
              <AuditPagination
                filters={filters}
                page={pagination.page}
                totalPages={pagination.totalPages}
              />
            ) : null}
          </div>
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
  icon: ReactNode;
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

function AuditPagination({
  filters,
  page,
  totalPages,
}: {
  filters: AuditExplorerProps["filters"];
  page: number;
  totalPages: number;
}) {
  const pages = getVisiblePages(page, totalPages);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {hasPrevious ? (
            <PaginationPrevious href={buildPageHref(filters, page - 1)} />
          ) : (
            <Button disabled size="default" type="button" variant="ghost">
              Previous
            </Button>
          )}
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={`${item}-${index}`}>
            {item === "ellipsis" ? (
              <span className="flex size-9 items-center justify-center text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <PaginationLink
                href={buildPageHref(filters, item)}
                isActive={item === page}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          {hasNext ? (
            <PaginationNext href={buildPageHref(filters, page + 1)} />
          ) : (
            <Button disabled size="default" type="button" variant="ghost">
              Next
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function buildPageHref(filters: AuditExplorerProps["filters"], page: number) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.action) {
    params.set("action", filters.action);
  }

  if (filters.resourceType) {
    params.set("resourceType", filters.resourceType);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/audit?${query}` : "/audit";
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(page - 1, 2);
  const end = Math.min(page + 1, totalPages - 1);

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
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
