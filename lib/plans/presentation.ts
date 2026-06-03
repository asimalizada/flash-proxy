import { getProductOption } from "@/lib/purchase/products";

const API_PRODUCT_ALIASES: Record<string, string> = {
  residential_lite: "residential-lite",
  mobile_usa: "mobile_usa",
  shared_isp: "shared_isp",
  dedicated_isp: "dedicated_isp",
  unlimited_residential: "unlimited_residential",
  ipv6_residential: "ipv6-residential",
  ipv6_datacenter: "ipv6-datacenter",
};

export function normalizePlanProduct(product?: string | null) {
  if (!product) {
    return undefined;
  }

  return API_PRODUCT_ALIASES[product] ?? product;
}

export function getPlanProductDisplay(product?: string | null) {
  const normalized = normalizePlanProduct(product);

  if (!normalized) {
    return {
      label: "--",
      group: "--",
    };
  }

  if (normalized.startsWith("pool")) {
    return {
      label: `Pool ${normalized.replace("pool", "")}`,
      group: "Pools",
    };
  }

  const option = getProductOption(normalized as never);

  return {
    label: option?.label ?? normalized,
    group: option?.group ?? "--",
  };
}

export function getPlanCost(plan: {
  billing?: { cost_cents?: number; cost_formatted?: string };
  purchase_price_cents?: number;
}) {
  if (plan.billing?.cost_formatted) {
    return plan.billing.cost_formatted;
  }

  const cents = plan.billing?.cost_cents ?? plan.purchase_price_cents;

  if (typeof cents === "number") {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return "--";
}

export function formatBytesToGb(bytes?: number | null) {
  if (!bytes || bytes <= 0) {
    return "0 GB";
  }

  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}
