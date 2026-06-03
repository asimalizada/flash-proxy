import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import { BalanceError, getBalancePricing } from "@/lib/balance/service";

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
    const data = await getBalancePricing(session, request);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof BalanceError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to load pricing");
  }
}
