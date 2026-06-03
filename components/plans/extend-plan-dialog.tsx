"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleAlert, HardDrive, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FlashProxyPlan } from "@/lib/plans/types";
import { normalizePlanProduct } from "@/lib/plans/presentation";
import {
  isHybridProduct,
  type PurchaseProduct,
} from "@/lib/purchase/products";

type ExtendPlanDialogProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onConfirm: (payload: {
    add_bandwidth_gb?: number;
    add_days?: number;
    extend_30_days?: true;
  }, idempotencyKey: string) => void;
  onOpenChange: (open: boolean) => void;
  plan: FlashProxyPlan;
};

export function ExtendPlanDialog({
  isOpen,
  isSubmitting,
  onConfirm,
  onOpenChange,
  plan,
}: ExtendPlanDialogProps) {
  const normalizedProduct = normalizePlanProduct(plan.product) ?? "";
  const [addBandwidthGb, setAddBandwidthGb] = useState("5");
  const [addDays, setAddDays] = useState("30");
  const [quote, setQuote] = useState<Quote>({
    status: "loading",
    message: "Loading extension price",
  });
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const mode = useMemo(() => {
    if (normalizedProduct === "unlimited_residential") {
      return "unsupported";
    }

    if (normalizedProduct === "dedicated_isp") {
      return "dedicated";
    }

    if (isHybridProduct(normalizedProduct as PurchaseProduct)) {
      return "hybrid";
    }

    return "bandwidth";
  }, [normalizedProduct]);

  const title =
    mode === "dedicated" ? "Extend dedicated plan" : "Extend plan";
  const payload = useMemo(() => {
    if (mode === "dedicated") {
      return { extend_30_days: true as const };
    }

    if (mode === "hybrid") {
      return {
        add_bandwidth_gb: addBandwidthGb ? Number(addBandwidthGb) : undefined,
        add_days: addDays ? Number(addDays) : undefined,
      };
    }

    return {
      add_bandwidth_gb: addBandwidthGb ? Number(addBandwidthGb) : undefined,
    };
  }, [addBandwidthGb, addDays, mode]);
  const canConfirm =
    !isSubmitting &&
    !isQuoteLoading &&
    mode !== "unsupported" &&
    quote.status === "ready";

  useEffect(() => {
    if (!isOpen || mode === "unsupported") {
      return;
    }

    let cancelled = false;

    async function loadQuote() {
      setIsQuoteLoading(true);
      setQuote({
        status: "loading",
        message: "Loading extension price",
      });

      try {
        const response = await fetch(`/api/plans/${plan.plan_id}/extend/price`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(payload),
        });
        const json = (await response.json()) as
          | {
              success: true;
              data: {
                cost_cents?: number;
                cost_formatted?: string;
                items?: Array<{
                  request?: Record<string, unknown>;
                  price?: {
                    mode?: string;
                    gb_required?: number;
                    allocation_available?: number;
                  };
                }>;
              };
            }
          | { success: false; error?: { message?: string } };

        if (cancelled) {
          return;
        }

        if (!response.ok || !json.success) {
          setQuote({
            status: "unavailable",
            message:
              json.success === false
                ? (json.error?.message ?? "Unable to check extension price")
                : "Unable to check extension price",
          });
          return;
        }

        setQuote({
          status: "ready",
          costCents: json.data.cost_cents ?? 0,
          costFormatted: json.data.cost_formatted,
          lines: buildQuoteLines(json.data.items ?? []),
        });
      } catch {
        if (!cancelled) {
          setQuote({
            status: "unavailable",
            message: "Unable to check extension price",
          });
        }
      } finally {
        if (!cancelled) {
          setIsQuoteLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, payload, plan.plan_id]);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Add more bandwidth or time to the current proxy plan.
          </DialogDescription>
        </DialogHeader>

        {mode === "unsupported" ? (
          <div className="rounded-md border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
            This product cannot be extended. Create a new plan instead.
          </div>
        ) : null}

        {mode === "bandwidth" ? (
          <FieldCard
            icon={<HardDrive className="size-4 text-primary" />}
            label="Add bandwidth, GB"
          >
            <Input
              min="0.1"
              onChange={(event) => setAddBandwidthGb(event.target.value)}
              step="0.1"
              type="number"
              value={addBandwidthGb}
            />
          </FieldCard>
        ) : null}

        {mode === "hybrid" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldCard
              icon={<HardDrive className="size-4 text-primary" />}
              label="Add bandwidth, GB"
            >
              <Input
                min="0.1"
                onChange={(event) => setAddBandwidthGb(event.target.value)}
                step="0.1"
                type="number"
                value={addBandwidthGb}
              />
            </FieldCard>
            <FieldCard
              icon={<CalendarDays className="size-4 text-primary" />}
              label="Add days"
            >
              <Input
                min="1"
                onChange={(event) => setAddDays(event.target.value)}
                step="1"
                type="number"
                value={addDays}
              />
            </FieldCard>
          </div>
        ) : null}

        {mode === "dedicated" ? (
          <div className="rounded-md border bg-background/56 p-4">
            <div className="flex items-center gap-3">
              <span className="rounded-md border bg-background/70 p-2">
                <CalendarDays className="size-4 text-primary" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Extension</p>
                <p className="mt-1 font-medium">Add 30 days</p>
              </div>
            </div>
          </div>
        ) : null}

        {mode !== "unsupported" ? (
          <QuoteCard
            isLoading={isQuoteLoading}
            quote={quote}
          />
        ) : null}

        <DialogFooter>
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              onConfirm(payload, crypto.randomUUID());
            }}
            type="button"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {isSubmitting ? "Extending" : "Confirm extension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Quote =
  | {
      status: "ready";
      costCents: number;
      costFormatted?: string;
      lines: string[];
    }
  | {
      status: "loading" | "unavailable" | "invalid";
      message: string;
    };

function QuoteCard({
  isLoading,
  quote,
}: {
  isLoading: boolean;
  quote: Quote;
}) {
  if (isLoading || quote.status === "loading") {
    return (
      <div className="rounded-md border bg-background/56 px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading extension price
        </div>
      </div>
    );
  }

  if (quote.status !== "ready") {
    return (
      <div className="rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <div className="flex items-center gap-2">
          <CircleAlert className="size-4" />
          {quote.message}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/56 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Estimated charge</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {quote.costFormatted ?? formatCents(quote.costCents)}
          </p>
        </div>
        <div className="space-y-1 text-right text-xs text-muted-foreground">
          {quote.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldCard({
  children,
  icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-md border bg-background/56 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-md border bg-background/70 p-2">{icon}</span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function formatCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function buildQuoteLines(
  items: Array<{
    request?: Record<string, unknown>;
    price?: {
      mode?: string;
      gb_required?: number;
      allocation_available?: number;
    };
  }>
) {
  return items.map((item) => {
    const request = item.request ?? {};
    const parts = [
      typeof request.bandwidth_gb === "number"
        ? `${request.bandwidth_gb} GB`
        : null,
      typeof request.duration === "string" ? formatDuration(request.duration) : null,
      typeof request.quantity === "number" ? `${request.quantity} IPs` : null,
      item.price?.mode ? `mode: ${item.price.mode}` : null,
    ].filter(Boolean);

    return parts.join(" • ") || "Extension price";
  });
}

function formatDuration(value: string) {
  return value.replaceAll("_", " ");
}
