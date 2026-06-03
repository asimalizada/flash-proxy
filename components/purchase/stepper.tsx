import { Check } from "lucide-react";

import type { WizardStep } from "@/components/purchase/types";
import { cn } from "@/lib/utils";

const STEPS = ["Product", "Configuration", "Price"] as const;

export function PurchaseStepper({ activeStep }: { activeStep: WizardStep }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {STEPS.map((label, index) => {
        const isActive = index === activeStep;
        const isComplete = index < activeStep;

        return (
          <div
            className={cn(
              "relative overflow-hidden rounded-md border bg-background/62 px-3 py-3 transition-all duration-200",
              isActive && "border-primary/45 bg-primary/10",
              isComplete && "border-primary/25"
            )}
            key={label}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md border text-xs font-semibold text-muted-foreground",
                  isActive && "border-primary/40 bg-primary text-primary-foreground",
                  isComplete && "border-primary/35 bg-primary/12 text-primary"
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
