import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { writeApiRequestLog } from "@/lib/audit/request-log";
import { createResellerSession } from "@/lib/auth/session";
import { fingerprintApiKey, hashApiKey } from "@/lib/auth/crypto";
import { FlashProxyError, isFlashProxyError } from "@/lib/flashproxy/errors";
import { flashProxyRequest } from "@/lib/flashproxy/client";
import { loginRequestSchema } from "@/lib/validation/auth";

type BalanceData = {
  balance_cents?: number;
  balance_formatted?: string;
  total_spent_cents?: number;
  total_spent_formatted?: string;
  allocations?: unknown;
};

const BALANCE_PATH = "/balance";

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

async function logLoginFailure(input: {
  request: Request;
  apiKeyHash?: string;
  reason: string;
  status?: number;
}) {
  await writeAuditLog({
    apiKeyHash: input.apiKeyHash,
    action: AUDIT_ACTIONS.LOGIN_FAILURE,
    resourceType: AUDIT_RESOURCE_TYPES.AUTH,
    metadata: {
      reason: input.reason,
      status: input.status,
    },
    request: input.request,
  });
}

async function logBalanceRequest(input: {
  sessionId?: string;
  result: { status: number; durationMs: number };
}) {
  await writeApiRequestLog({
    sessionId: input.sessionId,
    method: "GET",
    path: BALANCE_PATH,
    statusCode: input.result.status,
    durationMs: input.result.durationMs,
    success: true,
  });
}

async function logBalanceRequestError(input: {
  error: FlashProxyError;
  sessionId?: string;
}) {
  await writeApiRequestLog({
    sessionId: input.sessionId,
    method: "GET",
    path: BALANCE_PATH,
    statusCode: input.error.status || null,
    durationMs: input.error.durationMs,
    success: false,
    errorCode: input.error.code,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    await logLoginFailure({
      request,
      reason: "invalid_json",
      status: 400,
    });

    return jsonError(400, "INVALID_REQUEST", "Invalid login request");
  }

  const parsed = loginRequestSchema.safeParse(body);

  if (!parsed.success) {
    await logLoginFailure({
      request,
      reason: "validation_error",
      status: 400,
    });

    return jsonError(400, "VALIDATION_ERROR", "Enter a valid FlashProxy API key");
  }

  const { apiKey } = parsed.data;
  const apiKeyHash = hashApiKey(apiKey);

  try {
    const balanceResult = await flashProxyRequest<BalanceData>({
      apiKey,
      method: "GET",
      path: BALANCE_PATH,
    });

    const session = await createResellerSession({ apiKey, request });

    await logBalanceRequest({
      sessionId: session.id,
      result: balanceResult,
    });

    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      resourceType: AUDIT_RESOURCE_TYPES.AUTH,
      metadata: {
        api_key_fingerprint: session.apiKeyFingerprint,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: {
        session: {
          apiKeyFingerprint: session.apiKeyFingerprint,
          expiresAt: session.expiresAt.toISOString(),
        },
        account: balanceResult.data,
      },
    });
  } catch (error) {
    if (isFlashProxyError(error)) {
      await logBalanceRequestError({ error });
      await logLoginFailure({
        request,
        apiKeyHash,
        reason: error.code,
        status: error.status,
      });

      const status = error.status === 0 ? 502 : error.status;
      const code = error.status === 401 ? "UNAUTHORIZED" : error.code;
      const message =
        error.status === 401
          ? "The FlashProxy API key is invalid"
          : "Unable to validate the FlashProxy API key";

      return jsonError(status, code, message);
    }

    await logLoginFailure({
      request,
      apiKeyHash,
      reason: "internal_error",
      status: 500,
    });

    return jsonError(500, "INTERNAL_ERROR", "Unable to create login session");
  }
}
