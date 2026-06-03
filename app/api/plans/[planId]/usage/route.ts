import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import { getPlanUsage, PlansError } from "@/lib/plans/service";

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

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { planId } = await context.params;
    const data = await getPlanUsage(session, planId, request);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof PlansError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to load plan usage");
  }
}
