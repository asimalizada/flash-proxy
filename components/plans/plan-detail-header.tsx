"use client";

import { Network, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlashProxyPlan } from "@/lib/plans/types";
import { getPlanProductDisplay } from "@/lib/plans/presentation";
import { formatDate } from "@/lib/plans/formatters";

type PlanDetailHeaderProps = {
  canExtend: boolean;
  onExtend: () => void;
  plan: FlashProxyPlan;
};

export function PlanDetailHeader({
  canExtend,
  onExtend,
  plan,
}: PlanDetailHeaderProps) {
  const product = getPlanProductDisplay(plan.product);

  return (
    <section className="relative overflow-hidden rounded-md border bg-card/88 px-5 py-5 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(115deg,transparent,color-mix(in_oklch,var(--primary)_9%,transparent))]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Network className="size-3.5 text-primary" />
            {product.group}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            {product.label}
          </h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {plan.plan_id}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:min-h-[96px] lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge variant={plan.status === "active" ? "success" : "secondary"}>
              {plan.status ?? "--"}
            </Badge>
            <Badge variant="secondary">
              {plan.billing_type ?? product.group}
            </Badge>
            {plan.expires_at ? (
              <Badge variant="outline">
                Expires {formatDate(plan.expires_at)}
              </Badge>
            ) : null}
          </div>
          <Button
            disabled={!canExtend}
            onClick={onExtend}
            size="sm"
            type="button"
          >
            <Plus className="size-4" />
            Extend plan
          </Button>
        </div>
      </div>
    </section>
  );
}
