import { z } from "zod";

export const transactionTypeOptions = [
  "topup",
  "purchase",
  "extend",
  "refund",
  "adjustment",
] as const;

export const listBalanceTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum([...transactionTypeOptions, "all"]).default("all"),
});

export type ListBalanceTransactionsQueryInput = z.infer<
  typeof listBalanceTransactionsQuerySchema
>;
