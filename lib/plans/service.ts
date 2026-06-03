import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import type { AuthenticatedSession } from "@/lib/auth/session";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import type {
  ListPlansQuery,
  PlanExtensionData,
  PlanMetricsData,
  PlanMetricsDestinations,
  PlanMetricsErrors,
  PlanMetricsHourlyUsage,
  PlanMetricsLatency,
  PlanMetricsStatusCodes,
  PlanMetricsSummary,
  PlanMetricsThroughput,
  PlansListData,
  PlanUsageData,
} from "@/lib/plans/types";
import type { CreatePlanPayload } from "@/lib/validation/purchase";
import type { ExtendPlanPayload } from "@/lib/validation/plan-extend";

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

export async function getPlan(
  session: AuthenticatedSession,
  planId: string,
  request?: Request
): Promise<FlashProxyPlan> {
  const path = `/plans/${planId}` as const;

  try {
    const result = await flashProxyRequest<FlashProxyPlan>({
      apiKey: session.apiKey,
      method: "GET",
      path,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    if (request) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_VIEWED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        resourceId: result.data.plan_id ?? planId,
        metadata: {
          status: "success",
          product: result.data.product,
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
        path,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      if (request) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.PLAN_VIEWED,
          resourceType: AUDIT_RESOURCE_TYPES.PLAN,
          resourceId: planId,
          metadata: {
            status: "upstream_error",
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

export async function getPlanUsage(
  session: AuthenticatedSession,
  planId: string,
  request?: Request
): Promise<PlanUsageData> {
  const path = `/plans/${planId}/usage` as const;

  try {
    const result = await flashProxyRequest<PlanUsageData>({
      apiKey: session.apiKey,
      method: "GET",
      path,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    if (request) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_USAGE_VIEWED,
        resourceType: AUDIT_RESOURCE_TYPES.USAGE,
        resourceId: planId,
        metadata: {
          status: "success",
          product: result.data.product,
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
        path,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      if (request) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.PLAN_USAGE_VIEWED,
          resourceType: AUDIT_RESOURCE_TYPES.USAGE,
          resourceId: planId,
          metadata: {
            status: "upstream_error",
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

export async function extendPlan(
  session: AuthenticatedSession,
  input: {
    idempotencyKey: string;
    payload: ExtendPlanPayload;
    planId: string;
    request: Request;
  }
): Promise<PlanExtensionData> {
  const path = `/plans/${input.planId}/extend` as const;

  try {
    const result = await flashProxyRequest<PlanExtensionData, ExtendPlanPayload>({
      apiKey: session.apiKey,
      method: "POST",
      path,
      body: input.payload,
      idempotencyKey: input.idempotencyKey,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "POST",
      path,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.PLAN_EXTENDED,
      resourceType: AUDIT_RESOURCE_TYPES.PLAN,
      resourceId: input.planId,
      metadata: {
        status: "success",
        cost_cents: result.data.cost_cents,
        days_added: result.data.days_added,
        gb_added: result.data.gb_added,
      },
      request: input.request,
    });

    return result.data;
  } catch (error) {
    if (isFlashProxyError(error)) {
      await writeApiRequestLog({
        sessionId: session.id,
        method: "POST",
        path,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_EXTENDED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        resourceId: input.planId,
        metadata: {
          status: "upstream_error",
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

export async function getPlanMetrics(
  session: AuthenticatedSession,
  planId: string,
  input: {
    hours: number;
    request?: Request;
  }
): Promise<PlanMetricsData> {
  const query = { hours: input.hours };
  const summaryPath = `/plans/${planId}/metrics/summary` as const;

  try {
    const summary = await callPlanMetric<PlanMetricsSummary>(
      session,
      summaryPath,
      query
    );

    const [throughput, latency, errors, statusCodes, destinations, hourlyUsage] =
      await Promise.all([
        callOptionalPlanMetric<PlanMetricsThroughput>(
          session,
          `/plans/${planId}/metrics/throughput`,
          query,
          { hours: input.hours, series: [] }
        ),
        callOptionalPlanMetric<PlanMetricsLatency>(
          session,
          `/plans/${planId}/metrics/latency`,
          query,
          { hours: input.hours, series: [] }
        ),
        callOptionalPlanMetric<PlanMetricsErrors>(
          session,
          `/plans/${planId}/metrics/errors`,
          query,
          { hours: input.hours, series: [] }
        ),
        callOptionalPlanMetric<PlanMetricsStatusCodes>(
          session,
          `/plans/${planId}/metrics/status-codes`,
          query,
          { hours: input.hours, series: [] }
        ),
        callOptionalPlanMetric<PlanMetricsDestinations>(
          session,
          `/plans/${planId}/metrics/destinations`,
          { ...query, limit: 10 },
          { hours: input.hours, destinations: [] }
        ),
        callOptionalPlanMetric<PlanMetricsHourlyUsage>(
          session,
          `/plans/${planId}/metrics/hourly-usage`,
          query,
          { hours: input.hours, total_gb: 0, hourly: [] }
        ),
      ]);

    if (input.request) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.METRICS_VIEWED,
        resourceType: AUDIT_RESOURCE_TYPES.METRICS,
        resourceId: planId,
        metadata: {
          status: "success",
          hours: input.hours,
        },
        request: input.request,
      });
    }

    return {
      supported: true,
      hours: input.hours,
      summary: summary.data,
      throughput,
      latency,
      errors,
      statusCodes,
      destinations,
      hourlyUsage,
    };
  } catch (error) {
    if (isFlashProxyError(error)) {
      if (error.code === "METRICS_NOT_SUPPORTED") {
        if (input.request) {
          await writeAuditLog({
            sessionId: session.id,
            apiKeyHash: session.apiKeyHash,
            action: AUDIT_ACTIONS.METRICS_VIEWED,
            resourceType: AUDIT_RESOURCE_TYPES.METRICS,
            resourceId: planId,
            metadata: {
              status: "unsupported",
              hours: input.hours,
              error_code: error.code,
            },
            request: input.request,
          });
        }

        return {
          supported: false,
          hours: input.hours,
          code: "METRICS_NOT_SUPPORTED",
          message: error.message,
        };
      }

      if (input.request) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.METRICS_VIEWED,
          resourceType: AUDIT_RESOURCE_TYPES.METRICS,
          resourceId: planId,
          metadata: {
            status: "upstream_error",
            hours: input.hours,
            error_code: error.code,
          },
          request: input.request,
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

async function callPlanMetric<TData>(
  session: AuthenticatedSession,
  path: `/${string}`,
  query: Record<string, number>
) {
  try {
    const result = await flashProxyRequest<TData>({
      apiKey: session.apiKey,
      method: "GET",
      path,
      query,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    return result;
  } catch (error) {
    if (isFlashProxyError(error)) {
      await writeApiRequestLog({
        sessionId: session.id,
        method: "GET",
        path,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });
    }

    throw error;
  }
}

async function callOptionalPlanMetric<TData>(
  session: AuthenticatedSession,
  path: `/${string}`,
  query: Record<string, number>,
  fallback: TData
) {
  try {
    const result = await callPlanMetric<TData>(session, path, query);

    return result.data;
  } catch (error) {
    if (isFlashProxyError(error) && error.code === "METRICS_NOT_SUPPORTED") {
      return fallback;
    }

    throw error;
  }
}
