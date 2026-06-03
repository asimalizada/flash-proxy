import { z } from "zod";

import { PRODUCT_OPTIONS, type PurchaseProduct } from "@/lib/purchase/products";

const productValues = PRODUCT_OPTIONS.map((product) => product.value) as [
  PurchaseProduct,
  ...PurchaseProduct[],
];

export const listPlansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["active", "expired", "cancelled", "all"]).default("all"),
  product: z.enum(productValues).optional(),
  sort: z.enum(["created_at", "expires_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().max(100).optional(),
});

export type ListPlansQueryInput = z.infer<typeof listPlansQuerySchema>;
