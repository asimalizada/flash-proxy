import {
  Boxes,
  CalendarDays,
  Gauge,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FieldPanel } from "@/components/purchase/field-panel";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BillingType,
  PurchaseDraft,
  PurchaseDraftHandlers,
} from "@/components/purchase/types";
import {
  DURATION_OPTIONS,
  isBandwidthProduct,
  isHybridProduct,
  UNLIMITED_DURATION_OPTIONS,
} from "@/lib/purchase/products";
import { getProductDisplay } from "@/components/purchase/purchase-utils";
import { cn } from "@/lib/utils";

type ConfigurationStepProps = {
  draft: PurchaseDraft;
  handlers: PurchaseDraftHandlers;
};

export function ConfigurationStep({
  draft,
  handlers,
}: ConfigurationStepProps) {
  const selectedProduct = getProductDisplay(draft.product);
  const showBandwidth =
    isBandwidthProduct(draft.product) ||
    (isHybridProduct(draft.product) && draft.billingType === "bandwidth");
  const showHybridBilling = isHybridProduct(draft.product);
  const showTimeControls =
    isHybridProduct(draft.product) && draft.billingType === "time";
  const showUnlimited = draft.product === "unlimited_residential";
  const showDedicated = draft.product === "dedicated_isp";

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-md border bg-background/56 p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Selected product
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-semibold">{selectedProduct?.label}</p>
          <Badge variant="secondary">{selectedProduct?.group}</Badge>
        </div>
      </div>

      {showHybridBilling ? (
        <FieldPanel
          icon={<SlidersHorizontal className="size-4" />}
          label="Billing"
        >
          <div className="grid grid-cols-2 gap-2">
            {(["bandwidth", "time"] as const).map((type) => (
              <button
                className={cn(
                  "rounded-md border bg-card/70 px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:border-primary/35",
                  draft.billingType === type &&
                    "border-primary/50 bg-primary/10 text-primary"
                )}
                key={type}
                onClick={() => handlers.onBillingTypeChange(type)}
                type="button"
              >
                {type === "bandwidth" ? "Bandwidth" : "Time"}
              </button>
            ))}
          </div>
        </FieldPanel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {showBandwidth ? (
          <FieldPanel
            icon={<Network className="size-4" />}
            label="Bandwidth, GB"
          >
            <Input
              min={draft.product.startsWith("pool") ? 1 : 0.1}
              onChange={(event) =>
                handlers.onBandwidthGbChange(event.target.value)
              }
              step="0.1"
              type="number"
              value={draft.bandwidthGb}
            />
          </FieldPanel>
        ) : null}

        {isBandwidthProduct(draft.product) ? (
          <DurationField
            onChange={handlers.onDurationChange}
            value={draft.duration}
          />
        ) : null}

        {showTimeControls ? (
          <>
            <DurationField
              includeOneHour
              onChange={handlers.onDurationChange}
              value={draft.duration}
            />
            <FieldPanel icon={<Gauge className="size-4" />} label="Mbps">
              <Input
                max={10000}
                min={10}
                onChange={(event) => handlers.onMbpsChange(event.target.value)}
                step={10}
                type="number"
                value={draft.mbps}
              />
            </FieldPanel>
          </>
        ) : null}

        {showUnlimited ? (
          <>
            <FieldPanel
              icon={<CalendarDays className="size-4" />}
              label="Duration"
            >
              <Select
                onValueChange={handlers.onDurationChange}
                value={draft.duration}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNLIMITED_DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldPanel>

            {draft.duration !== "trial" ? (
              <FieldPanel
                icon={<Gauge className="size-4" />}
                label="Bandwidth cap, Mbps"
              >
                <Input
                  max={3000}
                  min={200}
                  onChange={(event) =>
                    handlers.onBandwidthMbpsChange(event.target.value)
                  }
                  step={100}
                  type="number"
                  value={draft.bandwidthMbps}
                />
              </FieldPanel>
            ) : null}
          </>
        ) : null}

        {showDedicated ? (
          <>
            <FieldPanel icon={<Boxes className="size-4" />} label="Quantity">
              <Input
                min={1}
                onChange={(event) =>
                  handlers.onQuantityChange(event.target.value)
                }
                step={1}
                type="number"
                value={draft.quantity}
              />
            </FieldPanel>

            <FieldPanel icon={<ShieldCheck className="size-4" />} label="Pool">
              <Input
                onChange={(event) => handlers.onPoolChange(event.target.value)}
                placeholder="ISP_US_SNEAKERS"
                value={draft.pool}
              />
            </FieldPanel>
          </>
        ) : null}

        <FieldPanel
          icon={<UserRound className="size-4" />}
          label="Customer reference"
        >
          <Input
            maxLength={100}
            onChange={(event) =>
              handlers.onEndUserReferenceChange(event.target.value)
            }
            placeholder="customer_12345"
            value={draft.endUserReference}
          />
        </FieldPanel>
      </div>
    </section>
  );
}

function DurationField({
  value,
  onChange,
  includeOneHour = false,
}: {
  value: string;
  onChange: (value: string) => void;
  includeOneHour?: boolean;
}) {
  return (
    <FieldPanel icon={<CalendarDays className="size-4" />} label="Duration">
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!includeOneHour ? <SelectItem value="none">No expiry</SelectItem> : null}
          {DURATION_OPTIONS.filter(
            (option) => includeOneHour || option.value !== "1_hour"
          ).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldPanel>
  );
}
