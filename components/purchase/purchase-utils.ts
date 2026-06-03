import {
  getProductOption,
  isBandwidthProduct,
  isHybridProduct,
  PRODUCT_OPTIONS,
  POOL_PRODUCTS,
  type PurchaseProduct,
} from "@/lib/purchase/products";
import type { PriceCheckData, PurchaseDraft } from "@/components/purchase/types";

export const DEFAULT_PRODUCT: PurchaseProduct = "residential-lite";
export const PRODUCT_GROUPS = [
  "All",
  ...new Set(PRODUCT_OPTIONS.map((item) => item.group)),
];

export function formatCost(price?: PriceCheckData) {
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

export function getDefaultGb(product: PurchaseProduct) {
  const option = getProductOption(product);
  return option?.defaultGb ? String(option.defaultGb) : "";
}

export function getProductDisplay(product: PurchaseProduct) {
  if ((POOL_PRODUCTS as readonly string[]).includes(product)) {
    return {
      label: "Pool (1-5)",
      group: "Pools",
    };
  }

  const option = getProductOption(product);

  return {
    label: option?.label ?? product,
    group: option?.group,
  };
}

export function getProductPayload(draft: PurchaseDraft) {
  const payload: Record<string, unknown> = {
    product: draft.product,
  };

  if (isHybridProduct(draft.product)) {
    payload.billing_type = draft.billingType;
  }

  if (
    isBandwidthProduct(draft.product) ||
    (isHybridProduct(draft.product) && draft.billingType === "bandwidth")
  ) {
    payload.bandwidth_gb = draft.bandwidthGb;
  }

  if (isBandwidthProduct(draft.product) && draft.duration !== "none") {
    payload.duration = draft.duration;
  }

  if (isHybridProduct(draft.product) && draft.billingType === "time") {
    payload.duration = draft.duration;
    payload.mbps = draft.mbps;
  }

  if (draft.product === "unlimited_residential") {
    payload.duration = draft.duration;

    if (draft.duration !== "trial") {
      payload.bandwidth_mbps = draft.bandwidthMbps;
    }
  }

  if (draft.product === "dedicated_isp") {
    payload.quantity = draft.quantity;
    payload.pool = draft.pool.trim();
  }

  if (draft.endUserReference.trim()) {
    payload.end_user_reference = draft.endUserReference.trim();
  }

  return payload;
}
