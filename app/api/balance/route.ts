import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import { BalanceError, getBalance } from "@/lib/balance/service";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const data = await getBalance(session, request);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof BalanceError) {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to load balance",
        },
      },
      { status: 500 }
    );
  }
}
