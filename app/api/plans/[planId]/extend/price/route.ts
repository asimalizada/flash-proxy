import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import { requireSession, SessionError } from "@/lib/auth/session";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import { getPlan, PlansError } from "@/lib/plans/service";
import type { FlashProxyPlan } from "@/lib/plans/types";
import { normalizePlanProduct } from "@/lib/plans/presentation";
import { isHybridProduct, type PurchaseProduct } from "@/lib/purchase/products";
import {
  buildExtendPlanPayload,
  extendPlanRequestSchema,
  validateExtendPayloadForPlan,
  type ExtendPlanPayload,
} from "@/lib/validation/plan-extend";
import type { CreatePlanPayload } from "@/lib/validation/purchase";

const CHECK_PRICE_PATH = "/plans/check-price";

type PriceCheckData = {
  cost_cents?: number;
  cost_usd?: string;
  mode?: "price" | "allocation" | "price_only";
  gb_required?: number;
  allocation_available?: number;
};

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { planId } = await context.params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_REQUEST", "Invalid extension price request");
    }

    const parsed = extendPlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PRICE_CHECKED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        resourceId: planId,
        metadata: {
          status: "validation_error",
          source: "plan_extension",
        },
        request,
      });

      return jsonError(400, "VALIDATION_ERROR", "Check the extension details");
    }

    const plan = await getPlan(session, planId);
    const validation = validateExtendPayloadForPlan({
      billingType: plan.billing_type,
      payload: parsed.data,
      product: normalizePlanProduct(plan.product),
    });

    if (!validation.ok) {
      return jsonError(400, "VALIDATION_ERROR", validation.message);
    }

    const payload = buildExtendPlanPayload(parsed.data);
    const priceRequests = buildPriceRequests(plan, payload);
    const priceItems = [];
    let totalCostCents = 0;

    for (const priceRequest of priceRequests) {
      const result = await flashProxyRequest<PriceCheckData, CreatePlanPayload>({
        apiKey: session.apiKey,
        method: "POST",
        path: CHECK_PRICE_PATH,
        body: priceRequest,
      });

      await writeApiRequestLog({
        sessionId: session.id,
        method: "POST",
        path: CHECK_PRICE_PATH,
        statusCode: result.status,
        durationMs: result.durationMs,
        success: true,
      });

      totalCostCents += result.data.cost_cents ?? 0;
      priceItems.push({
        request: priceRequest,
        price: result.data,
      });
    }

    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.PRICE_CHECKED,
      resourceType: AUDIT_RESOURCE_TYPES.PLAN,
      resourceId: planId,
      metadata: {
        status: "success",
        source: "plan_extension",
        product: normalizePlanProduct(plan.product),
        billing_type: plan.billing_type,
        cost_cents: totalCostCents,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: {
        cost_cents: totalCostCents,
        cost_formatted: formatCents(totalCostCents),
        items: priceItems,
      },
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof PlansError) {
      return jsonError(error.status, error.code, error.message);
    }

    if (isFlashProxyError(error)) {
      const { planId } = await context.params;

      await writeApiRequestLog({
        method: "POST",
        path: CHECK_PRICE_PATH,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      await writeAuditLog({
        action: AUDIT_ACTIONS.PRICE_CHECKED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        resourceId: planId,
        metadata: {
          status: "upstream_error",
          source: "plan_extension",
          error_code: error.code,
        },
        request,
      });

      return jsonError(
        error.status === 0 ? 502 : error.status,
        error.code,
        error.message
      );
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to check extension price");
  }
}

function buildPriceRequests(plan: FlashProxyPlan, payload: ExtendPlanPayload) {
  const product = normalizePlanProduct(plan.product) as PurchaseProduct | undefined;

  if (!product) {
    throw new PlansError(400, "VALIDATION_ERROR", "Plan product is unavailable");
  }

  if (payload.extend_30_days) {
    return [
      {
        product,
        quantity: plan.quantity ?? plan.proxy_list?.length,
        pool: plan.pool ?? undefined,
      },
    ] satisfies CreatePlanPayload[];
  }

  const requests: CreatePlanPayload[] = [];

  if (payload.add_bandwidth_gb !== undefined) {
    requests.push({
      product,
      billing_type: isHybridProduct(product) ? "bandwidth" : undefined,
      bandwidth_gb: payload.add_bandwidth_gb,
    });
  }

  if (payload.add_days !== undefined) {
    requests.push({
      product,
      billing_type: "time",
      duration: daysToDuration(payload.add_days),
      mbps: plan.limits?.max_mbps ?? undefined,
    });
  }

  return requests;
}

function daysToDuration(days: number) {
  const duration = {
    1: "1_day",
    7: "7_days",
    14: "14_days",
    30: "30_days",
    60: "60_days",
    90: "90_days",
  }[days];

  if (!duration) {
    throw new PlansError(
      400,
      "VALIDATION_ERROR",
      "Choose 1, 7, 14, 30, 60, or 90 days to preview extension price"
    );
  }

  return duration;
}

function formatCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}
