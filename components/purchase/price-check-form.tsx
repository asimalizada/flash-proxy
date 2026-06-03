"use client";

import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationStep } from "@/components/purchase/configuration-step";
import { PriceStep } from "@/components/purchase/price-step";
import { ProductStep } from "@/components/purchase/product-step";
import {
  DEFAULT_PRODUCT,
  getDefaultGb,
  getProductPayload,
} from "@/components/purchase/purchase-utils";
import { PurchaseStepper } from "@/components/purchase/stepper";
import type {
  BillingType,
  Direction,
  PriceCheckResult,
  PurchaseDraft,
  PurchaseDraftHandlers,
  WizardStep,
} from "@/components/purchase/types";
import {
  isHybridProduct,
  type PurchaseProduct,
} from "@/lib/purchase/products";
import { cn } from "@/lib/utils";
import styles from "@/components/purchase/price-check-form.module.css";

export function PriceCheckForm() {
  const [activeStep, setActiveStep] = useState<WizardStep>(0);
  const [direction, setDirection] = useState<Direction>("forward");
  const [draft, setDraft] = useState<PurchaseDraft>({
    product: DEFAULT_PRODUCT,
    billingType: "bandwidth",
    bandwidthGb: getDefaultGb(DEFAULT_PRODUCT),
    duration: "none",
    mbps: "100",
    bandwidthMbps: "500",
    quantity: "5",
    pool: "",
    endUserReference: "",
  });
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handlers: PurchaseDraftHandlers = {
    onProductChange: handleProductChange,
    onBillingTypeChange: (value) => {
      setDraftField("billingType", value);
      setDraftField("duration", value === "time" ? "7_days" : "none");
    },
    onBandwidthGbChange: (value) => setDraftField("bandwidthGb", value),
    onDurationChange: (value) => setDraftField("duration", value),
    onMbpsChange: (value) => setDraftField("mbps", value),
    onBandwidthMbpsChange: (value) => setDraftField("bandwidthMbps", value),
    onQuantityChange: (value) => setDraftField("quantity", value),
    onPoolChange: (value) => setDraftField("pool", value),
    onEndUserReferenceChange: (value) =>
      setDraftField("endUserReference", value),
  };

  function setDraftField<TKey extends keyof PurchaseDraft>(
    key: TKey,
    value: PurchaseDraft[TKey]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setResult(null);
    setError(null);
  }

  function goToStep(step: WizardStep) {
    setDirection(step > activeStep ? "forward" : "back");
    setActiveStep(step);
    setError(null);
  }

  function handleProductChange(value: PurchaseProduct) {
    setDraft((current) => ({
      ...current,
      product: value,
      billingType: isHybridProduct(value) ? "bandwidth" : current.billingType,
      bandwidthGb: getDefaultGb(value),
      duration:
        value === "unlimited_residential"
          ? "trial"
          : isHybridProduct(value)
            ? "7_days"
            : "none",
    }));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (activeStep !== 2) {
      goToStep((activeStep + 1) as WizardStep);
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/plans/check-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getProductPayload(draft)),
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
    <div className="mx-auto w-full max-w-5xl">
      <Card className="overflow-hidden bg-card/90 shadow-[0_18px_50px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
        <CardHeader className="border-b bg-background/42 p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <BadgeDollarSign className="size-3.5 text-primary" />
                  Purchase desk
                </div>
                <CardTitle className="mt-2 text-3xl tracking-normal">
                  Buy proxy
                </CardTitle>
              </div>
              <Badge variant={result ? "success" : "secondary"}>
                {result ? "Price checked" : "No charge"}
              </Badge>
            </div>
            <PurchaseStepper activeStep={activeStep} />
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="min-h-[400px] p-4 md:min-h-[400px] md:p-5">
            <div
              className={cn(
                styles.stepPanel,
                direction === "forward" ? styles.forward : styles.back
              )}
              key={`${activeStep}-${direction}`}
            >
              {activeStep === 0 ? (
                <ProductStep
                  onProductChange={handlers.onProductChange}
                  product={draft.product}
                />
              ) : null}

              {activeStep === 1 ? (
                <ConfigurationStep draft={draft} handlers={handlers} />
              ) : null}

              {activeStep === 2 ? (
                <PriceStep draft={draft} result={result} />
              ) : null}
            </div>

            {error ? (
              <div className="mx-auto mt-5 max-w-4xl rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>

          <div className="flex flex-col gap-3 border-t bg-background/42 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              disabled={activeStep === 0 || isChecking}
              onClick={() => goToStep((activeStep - 1) as WizardStep)}
              type="button"
              variant="outline"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <WizardPrimaryAction
              activeStep={activeStep}
              isChecking={isChecking}
              onContinue={() => goToStep((activeStep + 1) as WizardStep)}
            />
          </div>
        </form>
      </Card>
    </div>
  );
}

function WizardPrimaryAction({
  activeStep,
  isChecking,
  onContinue,
}: {
  activeStep: WizardStep;
  isChecking: boolean;
  onContinue: () => void;
}) {
  if (activeStep < 2) {
    return (
      <Button className="sm:min-w-40" onClick={onContinue} type="button">
        Continue
        <ArrowRight className="size-4" />
      </Button>
    );
  }

  return (
    <Button className="sm:min-w-44" disabled={isChecking} type="submit">
      {isChecking ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <BadgeDollarSign className="size-4" />
      )}
      Check price
    </Button>
  );
}
