export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGOUT: "logout",
  BALANCE_VIEWED: "balance_viewed",
  PRICING_VIEWED: "pricing_viewed",
  TRANSACTIONS_VIEWED: "transactions_viewed",
  PLANS_LISTED: "plans_listed",
  PLAN_VIEWED: "plan_viewed",
  PLAN_USAGE_VIEWED: "plan_usage_viewed",
  PRICE_CHECKED: "price_checked",
  PLAN_CREATION_FAILED: "plan_creation_failed",
  PLAN_CREATED: "plan_created",
  PLAN_EXTENDED: "plan_extended",
  ALLOWED_IPS_UPDATED: "allowed_ips_updated",
  METRICS_VIEWED: "metrics_viewed",
  CONNECTION_INFO_VIEWED: "connection_info_viewed",
  GEO_CATALOG_VIEWED: "geo_catalog_viewed",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_RESOURCE_TYPES = {
  AUTH: "auth",
  BALANCE: "balance",
  TRANSACTION: "transaction",
  PLAN: "plan",
  USAGE: "usage",
  METRICS: "metrics",
  PROXY: "proxy",
  GEO: "geo",
} as const;

export type AuditResourceType =
  (typeof AUDIT_RESOURCE_TYPES)[keyof typeof AUDIT_RESOURCE_TYPES];
