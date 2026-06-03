import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import type { RequestContext } from "@/lib/audit/context";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import type { AuthenticatedSession } from "@/lib/auth/session";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import type {
  BalanceData,
  BalanceTransactionsData,
  ListBalanceTransactionsQuery,
} from "@/lib/balance/types";

const BALANCE_PATH = "/balance";
const TRANSACTIONS_PATH = "/balance/transactions";

export class BalanceError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "BalanceError";
    this.status = status;
    this.code = code;
  }
}

export async function getBalance(
  session: AuthenticatedSession,
  request?: Request,
  context?: RequestContext
) {
  try {
    const result = await flashProxyRequest<BalanceData>({
      apiKey: session.apiKey,
      method: "GET",
      path: BALANCE_PATH,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path: BALANCE_PATH,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    if (request || context) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.BALANCE_VIEWED,
        resourceType: AUDIT_RESOURCE_TYPES.BALANCE,
        metadata: {
          status: "success",
        },
        request,
        context,
      });
    }

    return result.data;
  } catch (error) {
    if (isFlashProxyError(error)) {
      await writeApiRequestLog({
        sessionId: session.id,
        method: "GET",
        path: BALANCE_PATH,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      if (request || context) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.BALANCE_VIEWED,
          resourceType: AUDIT_RESOURCE_TYPES.BALANCE,
          metadata: {
            status: "upstream_error",
            error_code: error.code,
          },
          request,
          context,
        });
      }

      throw new BalanceError(
        error.status === 0 ? 502 : error.status,
        error.code,
        error.message
      );
    }

    throw error;
  }
}

export async function listBalanceTransactions(
  session: AuthenticatedSession,
  query: ListBalanceTransactionsQuery,
  request?: Request,
  context?: RequestContext
) {
  return listBalanceTransactionsWithQuery(session, query, request, context, true);
}

async function listBalanceTransactionsWithQuery(
  session: AuthenticatedSession,
  query: ListBalanceTransactionsQuery,
  request: Request | undefined,
  context: RequestContext | undefined,
  allowFilterFallback: boolean
): Promise<BalanceTransactionsData> {
  const upstreamQuery = {
    page: query.page,
    per_page: query.per_page,
    type: query.type === "all" ? undefined : query.type,
  };

  try {
    const result = await flashProxyRequest<BalanceTransactionsData>({
      apiKey: session.apiKey,
      method: "GET",
      path: TRANSACTIONS_PATH,
      query: upstreamQuery,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path: TRANSACTIONS_PATH,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    if (request || context) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.TRANSACTIONS_VIEWED,
        resourceType: AUDIT_RESOURCE_TYPES.TRANSACTION,
        metadata: {
          status: "success",
          page: query.page,
          per_page: query.per_page,
          filter_type: query.type,
        },
        request,
        context,
      });
    }

    return result.data;
  } catch (error) {
    if (isFlashProxyError(error)) {
      const fallbackType = query.type;

      await writeApiRequestLog({
        sessionId: session.id,
        method: "GET",
        path: TRANSACTIONS_PATH,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      if (
        allowFilterFallback &&
        fallbackType &&
        fallbackType !== "all" &&
        error.code === "VALIDATION_ERROR"
      ) {
        const data = await listBalanceTransactionsWithQuery(
          session,
          {
            ...query,
            page: 1,
            per_page: 100,
            type: "all",
          },
          undefined,
          undefined,
          false
        );

        const filteredItems = getTransactionItems(data).filter((item) =>
          matchesTransactionType(item.type, fallbackType)
        );
        const pageItems = filteredItems.slice(
          (query.page - 1) * query.per_page,
          query.page * query.per_page
        );

        if (request || context) {
          await writeAuditLog({
            sessionId: session.id,
            apiKeyHash: session.apiKeyHash,
            action: AUDIT_ACTIONS.TRANSACTIONS_VIEWED,
            resourceType: AUDIT_RESOURCE_TYPES.TRANSACTION,
            metadata: {
              status: "success",
              page: query.page,
              per_page: query.per_page,
              filter_type: query.type,
              filter_source: "local",
            },
            request,
            context,
          });
        }

        return {
          ...data,
          items: pageItems,
          pagination: {
            page: query.page,
            per_page: query.per_page,
            total: filteredItems.length,
            total_pages: Math.max(
              Math.ceil(filteredItems.length / query.per_page),
              1
            ),
          },
        };
      }

      if (request || context) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.TRANSACTIONS_VIEWED,
          resourceType: AUDIT_RESOURCE_TYPES.TRANSACTION,
          metadata: {
            status: "upstream_error",
            filter_type: query.type,
            error_code: error.code,
          },
          request,
          context,
        });
      }

      throw new BalanceError(
        error.status === 0 ? 502 : error.status,
        error.code,
        error.message
      );
    }

    throw error;
  }
}

function getTransactionItems(data: BalanceTransactionsData) {
  return data.items ?? data.transactions ?? [];
}

function matchesTransactionType(type: string | undefined, filter: string) {
  if (!type) {
    return false;
  }

  const normalized = type.toLowerCase().replaceAll(" ", "_");

  if (filter === "extend") {
    return normalized === "extend" || normalized === "extension";
  }

  if (filter === "adjustment") {
    return normalized === "adjustment" || normalized === "admin_credit";
  }

  return normalized === filter;
}
