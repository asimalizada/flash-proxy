import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { requireSession, SessionError } from "@/lib/auth/session";
import { normalizePlanProduct } from "@/lib/plans/presentation";
import { extendPlan, getPlan, PlansError } from "@/lib/plans/service";
import {
  buildExtendPlanPayload,
  extendPlanRequestSchema,
  validateExtendPayloadForPlan,
} from "@/lib/validation/plan-extend";

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

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { planId } = await context.params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_REQUEST", "Invalid extension request");
    }

    const parsed = extendPlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_EXTENDED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        resourceId: planId,
        metadata: {
          status: "validation_error",
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
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_EXTENDED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        resourceId: planId,
        metadata: {
          status: "validation_error",
          product: plan.product,
        },
        request,
      });

      return jsonError(400, "VALIDATION_ERROR", validation.message);
    }

    const payload = buildExtendPlanPayload(parsed.data);
    const idempotencyKey =
      request.headers.get("x-idempotency-key") || crypto.randomUUID();
    const data = await extendPlan(session, {
      idempotencyKey,
      payload,
      planId,
      request,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof PlansError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to extend plan");
  }
}
