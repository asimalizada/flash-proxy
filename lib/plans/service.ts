import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import type { AuthenticatedSession } from "@/lib/auth/session";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import type { ListPlansQuery, PlansListData } from "@/lib/plans/types";
import type { CreatePlanPayload } from "@/lib/validation/purchase";

import type { FlashProxyPlan } from "./types";

const PLANS_PATH = "/plans";

export class PlansError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PlansError";
    this.status = status;
    this.code = code;
  }
}

export async function listPlans(
  session: AuthenticatedSession,
  query: ListPlansQuery,
  request?: Request
) {
  try {
    const result = await flashProxyRequest<PlansListData>({
      apiKey: session.apiKey,
      method: "GET",
      path: PLANS_PATH,
      query,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path: PLANS_PATH,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    if (request) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLANS_LISTED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        metadata: {
          status: "success",
          page: query.page,
          per_page: query.per_page,
          filter_status: query.status,
          filter_product: query.product,
          search: query.search || undefined,
        },
        request,
      });
    }

    return result.data;
  } catch (error) {
    if (isFlashProxyError(error)) {
      await writeApiRequestLog({
        sessionId: session.id,
        method: "GET",
        path: PLANS_PATH,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      if (request) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.PLANS_LISTED,
          resourceType: AUDIT_RESOURCE_TYPES.PLAN,
          metadata: {
            status: "upstream_error",
            filter_status: query.status,
            filter_product: query.product,
            error_code: error.code,
          },
          request,
        });
      }

      throw new PlansError(
        error.status === 0 ? 502 : error.status,
        error.code,
        error.message
      );
    }

    throw error;
  }
}

export async function createPlan(
  session: AuthenticatedSession,
  input: {
    payload: CreatePlanPayload;
    idempotencyKey: string;
    request: Request;
  }
): Promise<FlashProxyPlan> {
  try {
    const result = await flashProxyRequest<FlashProxyPlan, CreatePlanPayload>({
      apiKey: session.apiKey,
      method: "POST",
      path: PLANS_PATH,
      body: input.payload,
      idempotencyKey: input.idempotencyKey,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "POST",
      path: PLANS_PATH,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.PLAN_CREATED,
      resourceType: AUDIT_RESOURCE_TYPES.PLAN,
      resourceId: result.data.plan_id,
      metadata: {
        status: "success",
        product: input.payload.product,
        billing_type: input.payload.billing_type,
        plan_id: result.data.plan_id,
        cost_cents: result.data.billing?.cost_cents,
      },
      request: input.request,
    });

    return result.data;
  } catch (error) {
    if (isFlashProxyError(error)) {
      await writeApiRequestLog({
        sessionId: session.id,
        method: "POST",
        path: PLANS_PATH,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_CREATED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        metadata: {
          status: "upstream_error",
          product: input.payload.product,
          billing_type: input.payload.billing_type,
          error_code: error.code,
        },
        request: input.request,
      });

      throw new PlansError(
        error.status === 0 ? 502 : error.status,
        error.code,
        error.message
      );
    }

    throw error;
  }
}
