import type { PurchaseProduct } from "@/lib/purchase/products";

export type BillingType = "bandwidth" | "time";
export type WizardStep = 0 | 1 | 2;
export type Direction = "forward" | "back";

export type PriceCheckData = {
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

export type PriceCheckResult = {
  request: Record<string, unknown>;
  price: PriceCheckData;
};

export type CreatedPlanResult = {
  plan_id?: string;
};

export type PurchaseDraft = {
  product: PurchaseProduct;
  billingType: BillingType;
  bandwidthGb: string;
  duration: string;
  mbps: string;
  bandwidthMbps: string;
  quantity: string;
  pool: string;
  endUserReference: string;
};

export type PurchaseDraftHandlers = {
  onProductChange: (value: PurchaseProduct) => void;
  onBillingTypeChange: (value: BillingType) => void;
  onBandwidthGbChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onMbpsChange: (value: string) => void;
  onBandwidthMbpsChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onPoolChange: (value: string) => void;
  onEndUserReferenceChange: (value: string) => void;
};
