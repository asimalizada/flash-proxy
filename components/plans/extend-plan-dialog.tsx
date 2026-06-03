"use client";

import { useMemo, useState } from "react";
import { CalendarDays, HardDrive, Loader2, Plus } from "lucide-react";

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
  }) => void;
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
  const normalizedProduct = normalizePlanProduct(plan.product);
  const [addBandwidthGb, setAddBandwidthGb] = useState("5");
  const [addDays, setAddDays] = useState("30");

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
            disabled={isSubmitting || mode === "unsupported"}
            onClick={() => {
              if (mode === "dedicated") {
                onConfirm({ extend_30_days: true });
                return;
              }

              if (mode === "hybrid") {
                onConfirm({
                  add_bandwidth_gb: addBandwidthGb ? Number(addBandwidthGb) : undefined,
                  add_days: addDays ? Number(addDays) : undefined,
                });
                return;
              }

              onConfirm({
                add_bandwidth_gb: addBandwidthGb ? Number(addBandwidthGb) : undefined,
              });
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
