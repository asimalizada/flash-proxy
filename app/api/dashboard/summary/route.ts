import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import {
  DashboardSummaryError,
  getDashboardSummary,
} from "@/lib/dashboard/summary";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const scope =
      new URL(request.url).searchParams.get("scope") === "critical"
        ? "critical"
        : "full";

    const summary = await getDashboardSummary(session, request, scope);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof DashboardSummaryError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    throw error;
  }
}
