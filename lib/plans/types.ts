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
