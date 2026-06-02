"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  DURATION_OPTIONS,
  getProductOption,
  isBandwidthProduct,
  isHybridProduct,
  PRODUCT_OPTIONS,
  UNLIMITED_DURATION_OPTIONS,
  type PurchaseProduct,
} from "@/lib/purchase/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type BillingType = "bandwidth" | "time";

type PriceCheckData = {
  cost_cents?: number;
  cost_usd?: string;
  mode?: "price" | "allocation" | "price_only";
  gb_required?: number;
  allocation_available?: number;
  trial_info?: {
    trials_used_today?: number;
    discounted_trials_remaining?: number;
    price_applied?: "discounted" | "full";
    discounted_price_cents?: number;
    full_price_cents?: number;
    daily_discount_limit?: number;
  };
};

type PriceCheckResult = {
  request: Record<string, unknown>;
  price: PriceCheckData;
};

const DEFAULT_PRODUCT: PurchaseProduct = "residential-lite";

function formatCost(price?: PriceCheckData) {
  if (!price) {
    return "--";
  }

  if (price.cost_usd) {
    return price.cost_usd.startsWith("$")
      ? price.cost_usd
      : `$${price.cost_usd}`;
  }

  if (typeof price.cost_cents === "number") {
    return `$${(price.cost_cents / 100).toFixed(2)}`;
  }

  return "--";
}

function getDefaultGb(product: PurchaseProduct) {
  const option = getProductOption(product);
  return option?.defaultGb ? String(option.defaultGb) : "";
}

function getProductPayload(input: {
  product: PurchaseProduct;
  billingType: BillingType;
  bandwidthGb: string;
  duration: string;
  mbps: string;
  bandwidthMbps: string;
  quantity: string;
  pool: string;
  endUserReference: string;
}) {
  const payload: Record<string, unknown> = {
    product: input.product,
  };

  if (isHybridProduct(input.product)) {
    payload.billing_type = input.billingType;
  }

  if (
    isBandwidthProduct(input.product) ||
    (isHybridProduct(input.product) && input.billingType === "bandwidth")
  ) {
    payload.bandwidth_gb = input.bandwidthGb;
  }

  if (isBandwidthProduct(input.product) && input.duration !== "none") {
    payload.duration = input.duration;
  }

  if (isHybridProduct(input.product) && input.billingType === "time") {
    payload.duration = input.duration;
    payload.mbps = input.mbps;
  }

  if (input.product === "unlimited_residential") {
    payload.duration = input.duration;

    if (input.duration !== "trial") {
      payload.bandwidth_mbps = input.bandwidthMbps;
    }
  }

  if (input.product === "dedicated_isp") {
    payload.quantity = input.quantity;
    payload.pool = input.pool.trim();
  }

  if (input.endUserReference.trim()) {
    payload.end_user_reference = input.endUserReference.trim();
  }

  return payload;
}

export function PriceCheckForm() {
  const [product, setProduct] = useState<PurchaseProduct>(DEFAULT_PRODUCT);
  const [billingType, setBillingType] = useState<BillingType>("bandwidth");
  const [bandwidthGb, setBandwidthGb] = useState(getDefaultGb(DEFAULT_PRODUCT));
  const [duration, setDuration] = useState("none");
  const [mbps, setMbps] = useState("100");
  const [bandwidthMbps, setBandwidthMbps] = useState("500");
  const [quantity, setQuantity] = useState("5");
  const [pool, setPool] = useState("");
  const [endUserReference, setEndUserReference] = useState("");
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const selectedProduct = useMemo(
    () => getProductOption(product),
    [product]
  );
  const showBandwidth =
    isBandwidthProduct(product) ||
    (isHybridProduct(product) && billingType === "bandwidth");
  const showHybridBilling = isHybridProduct(product);
  const showTimeControls = isHybridProduct(product) && billingType === "time";
  const showUnlimited = product === "unlimited_residential";
  const showDedicated = product === "dedicated_isp";

  function handleProductChange(value: string) {
    const nextProduct = value as PurchaseProduct;

    setProduct(nextProduct);
    setResult(null);
    setError(null);
    setBandwidthGb(getDefaultGb(nextProduct));

    if (isHybridProduct(nextProduct)) {
      setBillingType("bandwidth");
      setDuration("7_days");
    } else if (nextProduct === "unlimited_residential") {
      setDuration("trial");
    } else {
      setDuration("none");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChecking(true);
    setError(null);
    setResult(null);

    const payload = getProductPayload({
      product,
      billingType,
      bandwidthGb,
      duration,
      mbps,
      bandwidthMbps,
      quantity,
      pool,
      endUserReference,
    });

    try {
      const response = await fetch("/api/plans/check-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.error?.message ?? "Unable to check price");
        return;
      }

      setResult(json.data);
    } catch {
      setError("Unable to reach the pricing service");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[1fr_380px]">
      <Card className="overflow-hidden bg-card/88 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <CardHeader className="border-b bg-background/38">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Buy proxy</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Check price before creating a plan.
              </p>
            </div>
            <Badge variant="secondary">No charge</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select onValueChange={handleProductChange} value={product}>
                  <SelectTrigger id="product" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border bg-background/56 px-4 py-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Type
                </p>
                <p className="mt-2 font-semibold">{selectedProduct?.group}</p>
              </div>
            </div>

            {showHybridBilling ? (
              <div className="grid gap-2">
                <Label>Billing</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["bandwidth", "time"] as const).map((type) => (
                    <button
                      className={cn(
                        "rounded-md border bg-background/56 px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:border-primary/35",
                        billingType === type &&
                          "border-primary/50 bg-primary/10 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_28%,transparent)]"
                      )}
                      key={type}
                      onClick={() => {
                        setBillingType(type);
                        setResult(null);
                        setDuration(type === "time" ? "7_days" : "none");
                      }}
                      type="button"
                    >
                      {type === "bandwidth" ? "Bandwidth" : "Time"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {showBandwidth ? (
                <div className="grid gap-2">
                  <Label htmlFor="bandwidth_gb">Bandwidth, GB</Label>
                  <Input
                    id="bandwidth_gb"
                    min={product.startsWith("pool") ? 1 : 0.1}
                    onChange={(event) => setBandwidthGb(event.target.value)}
                    step="0.1"
                    type="number"
                    value={bandwidthGb}
                  />
                </div>
              ) : null}

              {isBandwidthProduct(product) ? (
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select onValueChange={setDuration} value={duration}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No expiry</SelectItem>
                      {DURATION_OPTIONS.filter(
                        (option) => option.value !== "1_hour"
                      ).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {showTimeControls ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="time_duration">Duration</Label>
                    <Select onValueChange={setDuration} value={duration}>
                      <SelectTrigger id="time_duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mbps">Mbps</Label>
                    <Input
                      id="mbps"
                      max={10000}
                      min={10}
                      onChange={(event) => setMbps(event.target.value)}
                      step={10}
                      type="number"
                      value={mbps}
                    />
                  </div>
                </>
              ) : null}

              {showUnlimited ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="unlimited_duration">Duration</Label>
                    <Select onValueChange={setDuration} value={duration}>
                      <SelectTrigger id="unlimited_duration">
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
                  </div>

                  {duration !== "trial" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="bandwidth_mbps">Bandwidth cap, Mbps</Label>
                      <Input
                        id="bandwidth_mbps"
                        max={3000}
                        min={200}
                        onChange={(event) =>
                          setBandwidthMbps(event.target.value)
                        }
                        step={100}
                        type="number"
                        value={bandwidthMbps}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}

              {showDedicated ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      min={1}
                      onChange={(event) => setQuantity(event.target.value)}
                      step={1}
                      type="number"
                      value={quantity}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pool">Pool</Label>
                    <Input
                      id="pool"
                      onChange={(event) => setPool(event.target.value)}
                      placeholder="ISP_US_SNEAKERS"
                      value={pool}
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end_user_reference">Customer reference</Label>
              <Input
                id="end_user_reference"
                maxLength={100}
                onChange={(event) => setEndUserReference(event.target.value)}
                placeholder="customer_12345"
                value={endUserReference}
              />
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button className="h-11 justify-between" disabled={isChecking}>
              <span className="flex items-center gap-2">
                {isChecking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BadgeDollarSign className="size-4" />
                )}
                Check price
              </span>
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-card/88 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <CardHeader className="border-b bg-background/38">
          <CardTitle>Price preview</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="rounded-md border bg-background/56 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Estimated cost
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-normal">
              {formatCost(result?.price)}
            </p>
            {result?.price.mode ? (
              <Badge className="mt-4" variant="secondary">
                {result.price.mode}
              </Badge>
            ) : null}
          </div>

          {result ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" />
                Ready for confirmation
              </div>
              {typeof result.price.gb_required === "number" ? (
                <div className="flex justify-between gap-3 rounded-md border bg-background/48 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">GB required</span>
                  <span className="font-medium">{result.price.gb_required}</span>
                </div>
              ) : null}
              {typeof result.price.allocation_available === "number" ? (
                <div className="flex justify-between gap-3 rounded-md border bg-background/48 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Allocation</span>
                  <span className="font-medium">
                    {result.price.allocation_available} GB
                  </span>
                </div>
              ) : null}
              {result.price.trial_info ? (
                <div className="rounded-md border bg-background/48 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Trials today</span>
                    <span className="font-medium">
                      {result.price.trial_info.trials_used_today ?? 0}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-muted-foreground">Discounted left</span>
                    <span className="font-medium">
                      {result.price.trial_info.discounted_trials_remaining ?? 0}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <div className="h-10 rounded-md bg-primary/8" />
              <div className="h-10 rounded-md bg-chart-2/8" />
              <div className="h-10 rounded-md bg-chart-3/10" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
