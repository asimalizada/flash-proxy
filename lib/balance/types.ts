export type BalanceData = {
  balance_cents?: number;
  balance_formatted?: string;
  total_spent_cents?: number;
  total_spent_formatted?: string;
  allocations?: Record<string, unknown>;
};

export type TransactionType =
  | "topup"
  | "purchase"
  | "extend"
  | "refund"
  | "adjustment";

export type BalanceTransaction = {
  id?: string;
  type?: TransactionType | string;
  amount_cents?: number;
  amount_formatted?: string;
  description?: string;
  balance_after_cents?: number;
  balance_after_formatted?: string;
  plan_id?: string;
  created_at?: string;
};

export type BalanceTransactionsPagination = {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
};

export type BalanceTransactionsData = {
  items?: BalanceTransaction[];
  transactions?: BalanceTransaction[];
  pagination?: BalanceTransactionsPagination;
};

export type BalancePricingItem = {
  billing?: "bandwidth" | "time" | "hybrid" | string;
  price_per_gb?: number;
  price_per_gb_formatted?: string;
  price_per_day_cents?: number;
  price_per_day_formatted?: string;
};

export type BalancePricingData = Record<string, BalancePricingItem>;

export type ListBalanceTransactionsQuery = {
  page: number;
  per_page: number;
  type?: TransactionType | "all";
};
