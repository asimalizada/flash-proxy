import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import type { AuthenticatedSession } from "@/lib/auth/session";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import { isFlashProxyError } from "@/lib/flashproxy/errors";
import type { ProxyConnectionInfoData } from "@/lib/proxies/types";

const CONNECTION_INFO_PATH = "/proxies/connection-info";

export class ProxiesError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ProxiesError";
    this.status = status;
    this.code = code;
  }
}

export async function getProxyConnectionInfo(
  session: AuthenticatedSession,
  request?: Request
) {
  try {
    const result = await flashProxyRequest<ProxyConnectionInfoData>({
      apiKey: session.apiKey,
      method: "GET",
      path: CONNECTION_INFO_PATH,
    });

    await writeApiRequestLog({
      sessionId: session.id,
      method: "GET",
      path: CONNECTION_INFO_PATH,
      statusCode: result.status,
      durationMs: result.durationMs,
      success: true,
    });

    if (request) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.CONNECTION_INFO_VIEWED,
        resourceType: AUDIT_RESOURCE_TYPES.PROXY,
        metadata: {
          status: "success",
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
        path: CONNECTION_INFO_PATH,
        statusCode: error.status || null,
        durationMs: error.durationMs,
        success: false,
        errorCode: error.code,
      });

      if (request) {
        await writeAuditLog({
          sessionId: session.id,
          apiKeyHash: session.apiKeyHash,
          action: AUDIT_ACTIONS.CONNECTION_INFO_VIEWED,
          resourceType: AUDIT_RESOURCE_TYPES.PROXY,
          metadata: {
            status: "upstream_error",
            error_code: error.code,
          },
          request,
        });
      }

      throw new ProxiesError(
        error.status === 0 ? 502 : error.status,
        error.code,
        error.message
      );
    }

    throw error;
  }
}
