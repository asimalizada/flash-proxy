import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatCost,
  getProductDisplay,
} from "@/components/purchase/purchase-utils";
import type {
  PriceCheckResult,
  PurchaseDraft,
} from "@/components/purchase/types";
import {
  isBandwidthProduct,
  isHybridProduct,
  isPoolProduct,
} from "@/lib/purchase/products";

type PriceStepProps = {
  draft: PurchaseDraft;
  result: PriceCheckResult | null;
};

export function PriceStep({ draft, result }: PriceStepProps) {
  const selectedProduct = getProductDisplay(draft.product);
  const showBandwidth =
    isBandwidthProduct(draft.product) ||
    (isHybridProduct(draft.product) && draft.billingType === "bandwidth");

  return (
    <section className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-md border bg-background/56 p-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Purchase summary
        </p>
        <div className="mt-5 space-y-3 text-sm">
          <SummaryRow label="Product" value={selectedProduct?.label} />
          <SummaryRow
            label="Billing"
            value={
              isHybridProduct(draft.product)
                ? draft.billingType
                : selectedProduct?.group
            }
          />
          {showBandwidth ? (
            <SummaryRow label="Bandwidth" value={`${draft.bandwidthGb || "--"} GB`} />
          ) : null}
          {isPoolProduct(draft.product) ? (
            <SummaryRow label="Pool" value={draft.product.replace("pool", "Pool ")} />
          ) : null}
          {draft.duration !== "none" ? (
            <SummaryRow label="Duration" value={draft.duration.replace("_", " ")} />
          ) : null}
          {draft.product === "dedicated_isp" ? (
            <SummaryRow label="Quantity" value={draft.quantity} />
          ) : null}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-md border bg-background/56 p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Estimated cost
        </p>
        <p className="mt-4 text-5xl font-semibold tracking-normal">
          {formatCost(result?.price)}
        </p>
        {result?.price.mode ? (
          <Badge className="mt-4" variant="secondary">
            {result.price.mode}
          </Badge>
        ) : null}

        {result ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="size-4" />
              Ready for confirmation
            </div>
            {typeof result.price.gb_required === "number" ? (
              <SummaryBox label="GB required" value={result.price.gb_required} />
            ) : null}
            {typeof result.price.allocation_available === "number" ? (
              <SummaryBox
                label="Allocation"
                value={`${result.price.allocation_available} GB`}
              />
            ) : null}
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div className="h-10 rounded-md bg-primary/8" />
            <div className="h-10 rounded-md bg-chart-2/8" />
            <div className="h-10 rounded-md bg-chart-3/10" />
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value ?? "--"}</span>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between gap-3 rounded-md border bg-card/58 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
