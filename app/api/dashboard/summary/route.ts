import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import {
  DashboardSummaryError,
  getDashboardSummary,
} from "@/lib/dashboard/summary";

export async function GET(request: Request) {
  const session = await requireSession();

  try {
    const summary = await getDashboardSummary(session, request);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof DashboardSummaryError) {
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
