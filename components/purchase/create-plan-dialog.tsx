"use client";

import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  PriceCheckResult,
  PurchaseDraft,
} from "@/components/purchase/types";
import {
  formatCost,
  getProductDisplay,
} from "@/components/purchase/purchase-utils";
import {
  isBandwidthProduct,
  isHybridProduct,
  isPoolProduct,
} from "@/lib/purchase/products";

type CreatePlanDialogProps = {
  draft: PurchaseDraft;
  isCreating: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  result: PriceCheckResult;
};

export function CreatePlanDialog({
  draft,
  isCreating,
  onConfirm,
  onOpenChange,
  open,
  result,
}: CreatePlanDialogProps) {
  const product = getProductDisplay(draft.product);
  const showBandwidth =
    isBandwidthProduct(draft.product) ||
    (isHybridProduct(draft.product) && draft.billingType === "bandwidth");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm purchase</DialogTitle>
          <DialogDescription>
            This creates the proxy plan and spends your reseller balance.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-card/68 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Product
              </p>
              <p className="mt-1 text-xl font-semibold">
                {product.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Estimated cost
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCost(result.price)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <SummaryRow
              label="Billing"
              value={
                isHybridProduct(draft.product)
                  ? draft.billingType
                  : product.group
              }
            />
            {showBandwidth ? (
              <SummaryRow label="Bandwidth" value={`${draft.bandwidthGb} GB`} />
            ) : null}
            {draft.duration !== "none" ? (
              <SummaryRow
                label="Duration"
                value={draft.duration.replace("_", " ")}
              />
            ) : null}
            {draft.product === "dedicated_isp" ? (
              <>
                <SummaryRow label="Quantity" value={draft.quantity} />
                <SummaryRow label="Pool" value={draft.pool} />
              </>
            ) : null}
            {isPoolProduct(draft.product) ? (
              <SummaryRow
                label="Pool"
                value={draft.product.replace("pool", "Pool ")}
              />
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isCreating}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isCreating} onClick={onConfirm} type="button">
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
            {isCreating ? "Creating plan" : "Confirm purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-background/60 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value || "--"}</span>
    </div>
  );
}
