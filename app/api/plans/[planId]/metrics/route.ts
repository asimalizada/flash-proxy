import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import { getPlanMetrics, PlansError } from "@/lib/plans/service";
import { planMetricsQuerySchema } from "@/lib/validation/plan-metrics";

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

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { planId } = await context.params;
    const url = new URL(request.url);
    const parsed = planMetricsQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid metrics window");
    }

    const data = await getPlanMetrics(session, planId, {
      hours: parsed.data.hours,
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

    return jsonError(500, "INTERNAL_ERROR", "Unable to load plan metrics");
  }
}
