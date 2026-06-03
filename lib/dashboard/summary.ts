import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import type { AuthenticatedSession } from "@/lib/auth/session";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import type {
  FlashProxyMethod,
  FlashProxyQuery,
} from "@/lib/flashproxy/types";

type BalanceData = {
  balance_cents?: number;
  balance_formatted?: string;
  total_spent_cents?: number;
  total_spent_formatted?: string;
  allocations?: Record<string, unknown>;
};

type PlanItem = {
  plan_id?: string;
  product?: string;
  status?: string;
  expires_at?: string | null;
  limits?: {
    max_bytes?: number | null;
    bytes_used?: number;
  };
};

type PlansData = {
  items?: PlanItem[];
  pagination?: {
    total?: number;
  };
};

type UsageSummaryData = {
  period?: string;
  total_bytes_used?: number;
  total_bytes_formatted?: string;
  by_product?: Record<
    string,
    {
      bytes_used?: number;
      bytes_formatted?: string;
      plans_count?: number;
    }
  >;
  daily_breakdown?: Array<{
    date?: string;
    bytes_used?: number;
  }>;
};

type RealtimeUsageData = {
  updated_at?: string;
  total_active_sessions?: number;
  active_plans?: Array<{
    plan_id?: string;
    product?: string;
    current_session_bytes?: number;
    total_bytes_used?: number;
    bytes_remaining?: number | null;
  }>;
};

type UpstreamCall<TData> = {
  method: FlashProxyMethod;
  path: `/${string}`;
  query?: FlashProxyQuery;
  data?: TData;
  error?: {
    status: number;
    code: string;
    message: string;
  };
};

export type DashboardSummary = {
  balance: {
    balanceCents: number | null;
    balanceFormatted: string;
    totalSpentCents: number | null;
    totalSpentFormatted: string;
    allocations: Record<string, unknown>;
  };
  plans: {
    total: number;
    active: number;
    expiringSoon: number;
    highUsage: number;
  };
  usage: {
    period: string;
    totalBytesUsed: number;
    totalBytesFormatted: string;
    byProduct: NonNullable<UsageSummaryData["by_product"]>;
    dailyBreakdown: NonNullable<UsageSummaryData["daily_breakdown"]>;
  };
  realtime: {
    updatedAt: string | null;
    totalActiveSessions: number;
    activePlans: NonNullable<RealtimeUsageData["active_plans"]>;
  };
  partialErrors: {
    balance: UpstreamCall<BalanceData>["error"] | null;
    plans: UpstreamCall<PlansData>["error"] | null;
    usage: UpstreamCall<UsageSummaryData>["error"] | null;
    realtime: UpstreamCall<RealtimeUsageData>["error"] | null;
  };
};

type DashboardSummaryScope = "critical" | "full";

export class DashboardSummaryError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "DashboardSummaryError";
    this.status = status;
    this.code = code;
  }
}

function getUsagePercent(plan: PlanItem) {
  const maxBytes = plan.limits?.max_bytes;
  const bytesUsed = plan.limits?.bytes_used ?? 0;

  if (!maxBytes || maxBytes <= 0) {
    return null;
  }

  return Math.round((bytesUsed / maxBytes) * 100);
}

function isExpiringSoon(plan: PlanItem) {
  if (!plan.expires_at || plan.status !== "active") {
    return false;
  }

  const expiresAt = new Date(plan.expires_at).getTime();

  if (Number.isNaN(expiresAt)) {
    return false;
  }

  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return expiresAt <= sevenDaysFromNow;
}

function summarizePlans(plans?: PlansData) {
  const items = plans?.items ?? (plans as PlansData & { plans?: PlanItem[] })?.plans ?? [];
  const active = items.filter((plan) => plan.status === "active");
  const highUsage = active.filter((plan) => {
    const usagePercent = getUsagePercent(plan);
    return usagePercent !== null && usagePercent >= 80;
  });

  return {
    total: plans?.pagination?.total ?? items.length,
    active: active.length,
    expiringSoon: active.filter(isExpiringSoon).length,
    highUsage: highUsage.length,
  };
}

async function callFlashProxy<TData>(
  session: AuthenticatedSession,
  input: Omit<UpstreamCall<TData>, "data" | "error">
): Promise<UpstreamCall<TData>> {
  try {
    const result = await flashProxyRequest<TData>({
      apiKey: session.apiKey,
      method: input.method,
      path: input.path,
      query: input.query,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: input.method,
      path: input.path,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    return {
      ...input,
      data: result.data,
    };
  } catch (error) {
    if (isFlashProxyError(error)) {
      await writeApiRequestLog({
        sessionId: session.id,
        method: input.method,
        path: input.path,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      return {
        ...input,
        error: {
          status: error.status,
          code: error.code,
          message: error.message,
        },
      };
    }

    throw error;
  }
}

function getCriticalError(calls: Array<UpstreamCall<unknown>>) {
  return calls.find((call) => call.error?.status === 401);
}

export async function getDashboardSummary(
  session: AuthenticatedSession,
  request?: Request,
  scope: DashboardSummaryScope = "full"
): Promise<DashboardSummary> {
  const [balanceCall, plansCall, usageCall, realtimeCall] = await Promise.all([
    callFlashProxy<BalanceData>(session, {
      method: "GET",
      path: "/balance",
    }),
    callFlashProxy<PlansData>(session, {
      method: "GET",
      path: "/plans",
      query: {
        page: 1,
        per_page: 100,
        status: "all",
        sort: "created_at",
        order: "desc",
      },
    }),
    scope === "full"
      ? callFlashProxy<UsageSummaryData>(session, {
          method: "GET",
          path: "/usage/summary",
          query: {
            period: "month",
          },
        })
      : Promise.resolve({
          method: "GET" as const,
          path: "/usage/summary" as const,
          data: undefined,
          error: undefined,
        }),
    scope === "full"
      ? callFlashProxy<RealtimeUsageData>(session, {
          method: "GET",
          path: "/usage/realtime",
        })
      : Promise.resolve({
          method: "GET" as const,
          path: "/usage/realtime" as const,
          data: undefined,
          error: undefined,
        }),
  ]);

  const criticalError = getCriticalError([
    balanceCall,
    plansCall,
    usageCall,
    realtimeCall,
  ]);

  if (criticalError?.error) {
    throw new DashboardSummaryError(
      criticalError.error.status,
      criticalError.error.code,
      criticalError.error.message
    );
  }

  if (request) {
    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.BALANCE_VIEWED,
      resourceType: AUDIT_RESOURCE_TYPES.BALANCE,
      metadata: {
        source: "dashboard_summary",
      },
      request,
    });

    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.PLANS_LISTED,
      resourceType: AUDIT_RESOURCE_TYPES.PLAN,
      metadata: {
        source: "dashboard_summary",
      },
      request,
    });
  }

  const balance = balanceCall.data;
  const plans = plansCall.data;
  const usage = usageCall.data;
  const realtime = realtimeCall.data;

  return {
    balance: {
      balanceCents: balance?.balance_cents ?? null,
      balanceFormatted: balance?.balance_formatted ?? "--",
      totalSpentCents: balance?.total_spent_cents ?? null,
      totalSpentFormatted: balance?.total_spent_formatted ?? "--",
      allocations: balance?.allocations ?? {},
    },
    plans: summarizePlans(plans),
    usage: {
      period: usage?.period ?? "month",
      totalBytesUsed: usage?.total_bytes_used ?? 0,
      totalBytesFormatted: usage?.total_bytes_formatted ?? "0 GB",
      byProduct: usage?.by_product ?? {},
      dailyBreakdown: usage?.daily_breakdown ?? [],
    },
    realtime: {
      updatedAt: realtime?.updated_at ?? null,
      totalActiveSessions: realtime?.total_active_sessions ?? 0,
      activePlans: realtime?.active_plans ?? [],
    },
    partialErrors: {
      balance: balanceCall.error ?? null,
      plans: plansCall.error ?? null,
      usage: usageCall.error ?? null,
      realtime: realtimeCall.error ?? null,
    },
  };
}
