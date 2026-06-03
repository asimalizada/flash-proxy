import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { requireSession, SessionError } from "@/lib/auth/session";
import { PlansError, createPlan, listPlans } from "@/lib/plans/service";
import { listPlansQuerySchema } from "@/lib/validation/plans";
import {
  buildCreatePlanPayload,
  createPlanRequestSchema,
} from "@/lib/validation/purchase";

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

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);

    const parsed = listPlansQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid plan filters");
    }

    const data = await listPlans(session, parsed.data, request);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof PlansError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to load plans");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "INVALID_REQUEST", "Invalid plan creation request");
    }

    const parsed = createPlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuditLog({
        sessionId: session.id,
        apiKeyHash: session.apiKeyHash,
        action: AUDIT_ACTIONS.PLAN_CREATED,
        resourceType: AUDIT_RESOURCE_TYPES.PLAN,
        metadata: {
          status: "validation_error",
        },
        request,
      });

      return jsonError(400, "VALIDATION_ERROR", "Check the purchase details");
    }

    const payload = buildCreatePlanPayload(parsed.data);
    const idempotencyKey =
      request.headers.get("x-idempotency-key") || crypto.randomUUID();
    const data = await createPlan(session, {
      payload,
      idempotencyKey,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SessionError || error instanceof PlansError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to create plan");
  }
}
