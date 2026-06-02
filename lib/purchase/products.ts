export const PRODUCT_OPTIONS = [
  {
    value: "residential-lite",
    label: "Residential Lite",
    group: "Bandwidth",
    defaultGb: 10,
  },
  {
    value: "residential",
    label: "Residential",
    group: "Bandwidth",
    defaultGb: 5,
  },
  {
    value: "mobile",
    label: "Mobile",
    group: "Bandwidth",
    defaultGb: 2,
  },
  {
    value: "mobile_usa",
    label: "Mobile USA",
    group: "Bandwidth",
    defaultGb: 2,
  },
  {
    value: "pool1",
    label: "Residential Pool 1",
    group: "Pools",
    defaultGb: 5,
  },
  {
    value: "pool2",
    label: "Residential Pool 2",
    group: "Pools",
    defaultGb: 5,
  },
  {
    value: "pool3",
    label: "Residential Pool 3",
    group: "Pools",
    defaultGb: 5,
  },
  {
    value: "pool4",
    label: "Residential Pool 4",
    group: "Pools",
    defaultGb: 5,
  },
  {
    value: "pool5",
    label: "Residential Pool 5",
    group: "Pools",
    defaultGb: 5,
  },
  {
    value: "datacenter",
    label: "Datacenter",
    group: "Hybrid",
    defaultGb: 10,
  },
  {
    value: "shared_isp",
    label: "Shared ISP",
    group: "Hybrid",
    defaultGb: 5,
  },
  {
    value: "ipv6-residential",
    label: "IPv6 Residential",
    group: "Hybrid",
    defaultGb: 10,
  },
  {
    value: "ipv6-datacenter",
    label: "IPv6 Datacenter",
    group: "Hybrid",
    defaultGb: 20,
  },
  {
    value: "unlimited_residential",
    label: "Unlimited Residential",
    group: "Time",
    defaultGb: null,
  },
  {
    value: "dedicated_isp",
    label: "Dedicated ISP",
    group: "Static",
    defaultGb: null,
  },
] as const;

export type PurchaseProduct = (typeof PRODUCT_OPTIONS)[number]["value"];

export const BANDWIDTH_PRODUCTS = [
  "residential-lite",
  "residential",
  "mobile",
  "mobile_usa",
  "pool1",
  "pool2",
  "pool3",
  "pool4",
  "pool5",
] as const satisfies readonly PurchaseProduct[];

export const HYBRID_PRODUCTS = [
  "datacenter",
  "shared_isp",
  "ipv6-residential",
  "ipv6-datacenter",
] as const satisfies readonly PurchaseProduct[];

export const POOL_PRODUCTS = [
  "pool1",
  "pool2",
  "pool3",
  "pool4",
  "pool5",
] as const satisfies readonly PurchaseProduct[];

export const DURATION_OPTIONS = [
  { value: "1_hour", label: "1 hour" },
  { value: "1_day", label: "1 day" },
  { value: "7_days", label: "7 days" },
  { value: "14_days", label: "14 days" },
  { value: "30_days", label: "30 days" },
  { value: "60_days", label: "60 days" },
  { value: "90_days", label: "90 days" },
] as const;

export const UNLIMITED_DURATION_OPTIONS = [
  { value: "trial", label: "Trial" },
  ...DURATION_OPTIONS,
] as const;

export type PurchaseDuration =
  (typeof UNLIMITED_DURATION_OPTIONS)[number]["value"];

export function isBandwidthProduct(product: PurchaseProduct) {
  return (BANDWIDTH_PRODUCTS as readonly string[]).includes(product);
}

export function isHybridProduct(product: PurchaseProduct) {
  return (HYBRID_PRODUCTS as readonly string[]).includes(product);
}

export function isPoolProduct(product: PurchaseProduct) {
  return (POOL_PRODUCTS as readonly string[]).includes(product);
}

export function getProductOption(product: PurchaseProduct) {
  return PRODUCT_OPTIONS.find((option) => option.value === product);
}
