import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import type {
  BalanceData,
  BalanceTransaction,
  BalanceTransactionsData,
  TransactionType,
} from "@/lib/balance/types";
import { transactionTypeOptions } from "@/lib/validation/balance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type BalanceScreenProps = {
  balance: BalanceData;
  filters: {
    page: number;
    per_page: number;
    type: TransactionType | "all";
  };
  transactions: BalanceTransactionsData;
};

export function BalanceScreen({
  balance,
  filters,
  transactions,
}: BalanceScreenProps) {
  const items = transactions.items ?? transactions.transactions ?? [];
  const pagination = normalizePagination(transactions, filters, items.length);
  const totalCredits = sumBySign(items, "credit");
  const totalDebits = sumBySign(items, "debit");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          detail="Available balance"
          icon={<DollarSign className="size-4" />}
          label="Balance"
          value={balance.balance_formatted ?? formatCents(balance.balance_cents)}
        />
        <MetricCard
          detail="Lifetime spend"
          icon={<CreditCard className="size-4" />}
          label="Spent"
          value={
            balance.total_spent_formatted ??
            formatCents(balance.total_spent_cents)
          }
        />
        <MetricCard
          detail="Current filter"
          icon={<WalletCards className="size-4" />}
          label="Transactions"
          value={String(pagination.total)}
        />
      </section>

      <Card className="bg-card/88 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-2xl tracking-normal">
              Balance transactions
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {filters.type !== "all" ? (
                <Button asChild size="sm" type="button" variant="outline">
                  <Link href="/balance">Clear filters</Link>
                </Button>
              ) : null}
              <Badge variant="secondary">
                {pagination.firstItem}-{pagination.lastItem} of{" "}
                {pagination.total}
              </Badge>
            </div>
          </div>

          <form className="grid gap-3 sm:grid-cols-[minmax(0,260px)_max-content]">
            <Select defaultValue={filters.type} name="type">
              <SelectTrigger>
                <SelectValue placeholder="All transaction types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All transaction types</SelectItem>
                {transactionTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatEnum(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto" type="submit">
              Apply
            </Button>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            <TotalPanel
              icon={<ArrowUpRight className="size-4 text-emerald-600" />}
              label="Credits shown"
              value={formatCents(totalCredits)}
            />
            <TotalPanel
              icon={<ArrowDownLeft className="size-4 text-rose-600" />}
              label="Debits shown"
              value={formatCents(totalDebits)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No balance transactions match these filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance after</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((transaction, index) => (
                    <TableRow key={transaction.id ?? `${transaction.created_at}-${index}`}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(transaction.type)}>
                          {formatEnum(transaction.type ?? "unknown")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px]">
                        <div className="flex items-center gap-2">
                          <ReceiptText className="size-4 text-muted-foreground" />
                          <span className="truncate text-sm">
                            {transaction.description ?? "--"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {truncate(transaction.plan_id) ?? "--"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={getAmountClass(transaction.amount_cents)}>
                          {transaction.amount_formatted ??
                            formatSignedCents(transaction.amount_cents)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {transaction.balance_after_formatted ??
                          formatCents(transaction.balance_after_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {pagination.totalPages > 1 ? (
              <BalancePagination
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
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
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
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-md border bg-background/70 p-2 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function TotalPanel({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background/52 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-normal">{value}</p>
      </div>
      <div className="rounded-md border bg-background/70 p-2">{icon}</div>
    </div>
  );
}

function BalancePagination({
  filters,
  page,
  totalPages,
}: {
  filters: BalanceScreenProps["filters"];
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

function normalizePagination(
  data: BalanceTransactionsData,
  filters: BalanceScreenProps["filters"],
  itemCount: number
) {
  const page = data.pagination?.page ?? filters.page;
  const perPage = data.pagination?.per_page ?? filters.per_page;
  const total = data.pagination?.total ?? itemCount;
  const totalPages = Math.max(data.pagination?.total_pages ?? Math.ceil(total / perPage), 1);

  return {
    firstItem: total === 0 ? 0 : (page - 1) * perPage + 1,
    lastItem: Math.min(page * perPage, total),
    page,
    perPage,
    total,
    totalPages,
  };
}

function buildPageHref(filters: BalanceScreenProps["filters"], page: number) {
  const params = new URLSearchParams();

  if (filters.type !== "all") {
    params.set("type", filters.type);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/balance?${query}` : "/balance";
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

function sumBySign(items: BalanceTransaction[], sign: "credit" | "debit") {
  return items.reduce((total, item) => {
    const amount = item.amount_cents ?? 0;

    if (sign === "credit" && amount > 0) {
      return total + amount;
    }

    if (sign === "debit" && amount < 0) {
      return total + Math.abs(amount);
    }

    return total;
  }, 0);
}

function getTypeVariant(type?: string) {
  if (type === "topup" || type === "refund") {
    return "success";
  }

  if (type === "purchase" || type === "extend") {
    return "secondary";
  }

  return "outline";
}

function getAmountClass(amount?: number) {
  if (!amount) {
    return "text-muted-foreground";
  }

  return amount > 0 ? "text-emerald-600" : "text-rose-600";
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

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCents(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function formatSignedCents(value?: number) {
  if (typeof value !== "number") {
    return "--";
  }

  const formatted = formatCents(Math.abs(value));

  if (value === 0) {
    return formatted;
  }

  return `${value > 0 ? "+" : "-"}${formatted}`;
}
