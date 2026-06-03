import { z } from "zod";

import {
  isBandwidthProduct,
  isHybridProduct,
  isPoolProduct,
  PRODUCT_OPTIONS,
  type PurchaseProduct,
} from "@/lib/purchase/products";

const productValues = PRODUCT_OPTIONS.map((product) => product.value) as [
  PurchaseProduct,
  ...PurchaseProduct[],
];

const emptyStringToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const optionalNumber = <T extends z.ZodType>(schema: T) =>
  z.preprocess(emptyStringToUndefined, schema.optional());

const optionalString = (max = 100) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

export const checkPriceRequestSchema = z
  .object({
    product: z.enum(productValues),
    billing_type: z.enum(["bandwidth", "time"]).optional(),
    bandwidth_gb: optionalNumber(z.coerce.number().positive()),
    duration: z
      .enum([
        "trial",
        "1_hour",
        "1_day",
        "7_days",
        "14_days",
        "30_days",
        "60_days",
        "90_days",
      ])
      .optional(),
    mbps: optionalNumber(z.coerce.number().int().min(10).max(10000)),
    bandwidth_mbps: optionalNumber(
      z.coerce.number().int().min(200).max(3000)
    ),
    quantity: optionalNumber(z.coerce.number().int().min(1)),
    pool: optionalString(80),
    end_user_reference: optionalString(100),
  })
  .superRefine((value, context) => {
    if (isBandwidthProduct(value.product)) {
      if (value.bandwidth_gb === undefined) {
        context.addIssue({
          code: "custom",
          path: ["bandwidth_gb"],
          message: "Bandwidth is required for this product",
        });
      }

      if (isPoolProduct(value.product) && (value.bandwidth_gb ?? 0) < 1) {
        context.addIssue({
          code: "custom",
          path: ["bandwidth_gb"],
          message: "Pool products require at least 1 GB",
        });
      }
    }

    if (isHybridProduct(value.product)) {
      if (!value.billing_type) {
        context.addIssue({
          code: "custom",
          path: ["billing_type"],
          message: "Billing type is required",
        });
      }

      if (value.billing_type === "bandwidth" && value.bandwidth_gb === undefined) {
        context.addIssue({
          code: "custom",
          path: ["bandwidth_gb"],
          message: "Bandwidth is required",
        });
      }

      if (value.billing_type === "time") {
        if (!value.duration) {
          context.addIssue({
            code: "custom",
            path: ["duration"],
            message: "Duration is required",
          });
        }

        if (value.duration === "trial") {
          context.addIssue({
            code: "custom",
            path: ["duration"],
            message: "Trial is only available for Unlimited Residential",
          });
        }

        if (value.mbps === undefined) {
          context.addIssue({
            code: "custom",
            path: ["mbps"],
            message: "Mbps is required",
          });
        }
      }
    }

    if (value.product === "unlimited_residential") {
      if (!value.duration) {
        context.addIssue({
          code: "custom",
          path: ["duration"],
          message: "Duration is required",
        });
      }

      if (value.duration !== "trial" && value.bandwidth_mbps === undefined) {
        context.addIssue({
          code: "custom",
          path: ["bandwidth_mbps"],
          message: "Bandwidth cap is required",
        });
      }
    }

    if (value.product === "dedicated_isp") {
      if (value.quantity === undefined) {
        context.addIssue({
          code: "custom",
          path: ["quantity"],
          message: "Quantity is required",
        });
      }

      if (!value.pool) {
        context.addIssue({
          code: "custom",
          path: ["pool"],
          message: "Pool is required",
        });
      }
    }
  });

export type CheckPriceRequestInput = z.infer<typeof checkPriceRequestSchema>;

// Alias used by POST /api/plans — same shape, clearer name at that call site.
export const createPlanRequestSchema = checkPriceRequestSchema;
export type CreatePlanRequestInput = CheckPriceRequestInput;

export type CreatePlanPayload = {
  product: PurchaseProduct;
  billing_type?: "bandwidth" | "time";
  bandwidth_gb?: number;
  duration?: string;
  mbps?: number;
  bandwidth_mbps?: number;
  quantity?: number;
  pool?: string;
  end_user_reference?: string;
};

export function buildCreatePlanPayload(
  input: CheckPriceRequestInput
): CreatePlanPayload {
  const payload: CreatePlanPayload = {
    product: input.product,
  };

  for (const key of [
    "billing_type",
    "bandwidth_gb",
    "duration",
    "mbps",
    "bandwidth_mbps",
    "quantity",
    "pool",
    "end_user_reference",
  ] as const) {
    const value = input[key];

    if (value !== undefined && value !== "") {
      Object.assign(payload, { [key]: value });
    }
  }

  return payload;
}
