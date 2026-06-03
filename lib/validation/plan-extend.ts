import { z } from "zod";

import {
  isHybridProduct,
  type PurchaseProduct,
} from "@/lib/purchase/products";

export const extendPlanRequestSchema = z.object({
  add_bandwidth_gb: z.coerce.number().positive().optional(),
  add_days: z.coerce.number().int().positive().optional(),
  extend_30_days: z.boolean().optional(),
});

export type ExtendPlanRequestInput = z.infer<typeof extendPlanRequestSchema>;

export type ExtendPlanPayload = {
  add_bandwidth_gb?: number;
  add_days?: number;
  extend_30_days?: true;
};

export function buildExtendPlanPayload(input: ExtendPlanRequestInput) {
  const payload: ExtendPlanPayload = {};

  if (typeof input.add_bandwidth_gb === "number") {
    payload.add_bandwidth_gb = input.add_bandwidth_gb;
  }

  if (typeof input.add_days === "number") {
    payload.add_days = input.add_days;
  }

  if (input.extend_30_days) {
    payload.extend_30_days = true;
  }

  return payload;
}

export function validateExtendPayloadForPlan(input: {
  billingType?: string;
  payload: ExtendPlanRequestInput;
  product?: PurchaseProduct | string;
}) {
  const { billingType, payload, product } = input;
  const normalizedProduct = product ?? "";

  if (normalizedProduct === "unlimited_residential") {
    return {
      ok: false as const,
      message:
        "Plan extension is not supported for this product. Please create a new plan instead.",
    };
  }

  if (normalizedProduct === "dedicated_isp") {
    if (!payload.extend_30_days) {
      return {
        ok: false as const,
        message: "Dedicated ISP plans can only be extended by 30 days.",
      };
    }

    return { ok: true as const };
  }

  if (isHybridProduct(normalizedProduct as PurchaseProduct)) {
    if (billingType === "time") {
      if (
        payload.add_bandwidth_gb === undefined &&
        payload.add_days === undefined
      ) {
        return {
          ok: false as const,
          message: "Add bandwidth or days to extend this plan.",
        };
      }

      return { ok: true as const };
    }

    if (billingType === "bandwidth") {
      if (
        payload.add_bandwidth_gb === undefined &&
        payload.add_days === undefined
      ) {
        return {
          ok: false as const,
          message: "Add bandwidth or days to extend this plan.",
        };
      }

      return { ok: true as const };
    }
  }

  if (payload.add_bandwidth_gb === undefined) {
    return {
      ok: false as const,
      message: "Add bandwidth to extend this plan.",
    };
  }

  return { ok: true as const };
}
