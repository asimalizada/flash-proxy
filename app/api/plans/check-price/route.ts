import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import { requireSession, SessionError } from "@/lib/auth/session";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import {
  buildCreatePlanPayload,
  checkPriceRequestSchema,
  type CreatePlanPayload,
} from "@/lib/validation/purchase";

const CHECK_PRICE_PATH = "/plans/check-price";

type PriceCheckData = {
  cost_cents?: number;
  cost_usd?: string;
  mode?: "price" | "allocation" | "price_only";
  gb_required?: number;
  allocation_available?: number;
  trial_info?: {
    trials_used_today?: number;
    discounted_trials_remaining?: number;
    price_applied?: "discounted" | "full";
    discounted_price_cents?: number;
    full_price_cents?: number;
    daily_discount_limit?: number;
  };
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

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_REQUEST", "Invalid price check request");
    }

    const parsed = checkPriceRequestSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PRICE_CHECKED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        metadata: {
          status: "validation_error",
        },
        request,
      });

      return jsonError(400, "VALIDATION_ERROR", "Check the purchase details");
    }

    const payload = buildCreatePlanPayload(parsed.data);

    try {
      const result = await flashProxyRequest<PriceCheckData, CreatePlanPayload>({
        apiKey: session.apiKey,
        method: "POST",
        path: CHECK_PRICE_PATH,
        body: payload,
      });

      await writeApiRequestLog({
        sessionId: session.id,
        method: "POST",
        path: CHECK_PRICE_PATH,
        statusCode: result.status,
        durationMs: result.durationMs,
        success: true,
      });

      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PRICE_CHECKED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        metadata: {
          status: "success",
          product: payload.product,
          billing_type: payload.billing_type,
          cost_cents: result.data.cost_cents,
          mode: result.data.mode,
        },
        request,
      });

      return NextResponse.json({
        success: true,
        data: {
          request: payload,
          price: result.data,
        },
      });
    } catch (error) {
      if (isFlashProxyError(error)) {
        await writeApiRequestLog({
          sessionId: session.id,
          method: "POST",
          path: CHECK_PRICE_PATH,
          statusCode: error.status || null,
          durationMs: error.durationMs,
          success: false,
          errorCode: error.code,
        });

        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.PRICE_CHECKED,
          resourceType: AUDIT_RESOURCE_TYPES.PLAN,
          metadata: {
            status: "upstream_error",
            product: payload.product,
            billing_type: payload.billing_type,
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

      throw error;
    }
  } catch (error) {
    if (error instanceof SessionError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to check price");
  }
}
