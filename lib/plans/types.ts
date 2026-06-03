import type { PurchaseProduct } from "@/lib/purchase/products";

export type PlanConnection = {
  hostname?: string;
  port_http?: number;
  port_socks?: number;
  format?: string;
};

export type PlanLimits = {
  max_gb?: number | null;
  max_bytes?: number | null;
  bytes_used?: number;
  max_mbps?: number | null;
};

export type PlanBilling = {
  mode?: "price" | "allocation" | "price_only";
  price_per_gb?: number;
  gb_purchased?: number;
  cost_cents?: number;
  cost_formatted?: string;
};

export type PlanProxyListItem = {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  full?: string;
};

export type FlashProxyPlan = {
  plan_id?: string;
  product?: PurchaseProduct | string;
  billing_type?: string;
  pool?: string;
  quantity?: number;
  proxy_username?: string;
  proxy_password?: string;
  connection?: PlanConnection;
  proxy_list?: PlanProxyListItem[];
  limits?: PlanLimits;
  expires_at?: string | null;
  status?: string;
  provider_user_id?: string;
  created_at?: string;
  updated_at?: string;
  activated_at?: string;
  billing?: PlanBilling;
  purchase_price_cents?: number;
  end_user_reference?: string | null;
  allowed_ips?: string[] | null;
};

export type PlansPagination = {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
};

export type PlansListData = {
  items?: FlashProxyPlan[];
  plans?: FlashProxyPlan[];
  pagination?: PlansPagination;
};

export type PlanStatusFilter = "active" | "expired" | "cancelled" | "all";
export type PlansSortField = "created_at" | "expires_at" | "updated_at";
export type SortOrder = "asc" | "desc";

export type ListPlansQuery = {
  page?: number;
  per_page?: number;
  status?: PlanStatusFilter;
  product?: PurchaseProduct;
  sort?: PlansSortField;
  order?: SortOrder;
  search?: string;
};

export type PlanUsageData = {
  plan_id?: string;
  product?: string;
  billing_type?: string;
  usage?: {
    bytes_used?: number;
    bytes_used_formatted?: string;
    bytes_remaining?: number;
    bytes_remaining_formatted?: string;
    max_bytes?: number;
    usage_percent?: number;
  };
  period?: {
    start?: string;
    end?: string;
  };
  daily_breakdown?: Array<{
    date?: string;
    bytes_used?: number;
  }>;
};

export type PlanExtensionData = {
  plan_id?: string;
  cost_cents?: number;
  cost_formatted?: string;
  gb_added?: number;
  days_added?: number;
  new_max_gb?: number;
  new_max_bytes?: number;
  new_expires_at?: string;
};

export type PlanMetricsSummary = {
  hours?: number;
  total_bytes?: number;
  total_mb?: number;
  total_connections?: number;
  total_successes?: number;
  total_errors?: number;
  success_rate_pct?: number | null;
  peak_concurrent?: number;
  avg_mbps?: number;
  peak_mbps?: number;
};

export type PlanMetricsThroughput = {
  hours?: number;
  bucket_minutes?: number;
  rate_cap_mbps?: number | null;
  series?: Array<{
    bucket?: string;
    mbps?: number;
  }>;
};

export type PlanMetricsLatency = {
  hours?: number;
  bucket_minutes?: number;
  series?: Array<{
    bucket?: string;
    p50?: number;
    p95?: number;
    p99?: number;
  }>;
};

export type PlanMetricsErrors = {
  hours?: number;
  bucket_minutes?: number;
  series?: Array<Record<string, number | string | undefined> & { bucket?: string }>;
};

export type PlanMetricsStatusCodes = {
  hours?: number;
  bucket_minutes?: number;
  series?: Array<{
    bucket?: string;
    s2xx?: number;
    s3xx?: number;
    s4xx?: number;
    s5xx?: number;
  }>;
};

export type PlanMetricsDestinations = {
  hours?: number;
  destinations?: Array<{
    destination?: string;
    connections?: number;
    successes?: number;
    errors?: number;
    mb_received?: number;
    mb_sent?: number;
    p95_ms?: number;
  }>;
};

export type PlanMetricsHourlyUsage = {
  hours?: number;
  total_gb?: number;
  hourly?: Array<{
    hour?: string;
    gb?: number;
  }>;
};

export type PlanMetricsData =
  | {
      supported: true;
      hours: number;
      summary: PlanMetricsSummary;
      throughput: PlanMetricsThroughput;
      latency: PlanMetricsLatency;
      errors: PlanMetricsErrors;
      statusCodes: PlanMetricsStatusCodes;
      destinations: PlanMetricsDestinations;
      hourlyUsage: PlanMetricsHourlyUsage;
    }
  | {
      supported: false;
      hours: number;
      code: "METRICS_NOT_SUPPORTED";
      message: string;
    };
